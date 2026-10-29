import { useMemo, useState } from 'react';
import { HARDWARE, categoryColor, type Category } from '../../data/hardware';
import { compute, costAnalysis, type Metrics } from '../../lib/engine';
import type { Config } from '../../lib/config';
import { num, tokens, tps, usdSmart } from '../../lib/format';
import { Pills } from '../ui';
import { AXIS, EChart, TOOLTIP, grad, type Option } from './EChart';

const BATCHES = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
const CONTEXTS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

// ---------------------------------------------------------------------------
// Batch ölçekleme: kullanıcı sayısı arttıkça hız ve toplam üretim
// ---------------------------------------------------------------------------
function BatchChart({ cfg }: { cfg: Config }) {
  const option = useMemo<Option>(() => {
    const limit = compute(cfg.hw, cfg.chips, { ...cfg, batch: 1 }).maxBatch;
    const xs = [...new Set([...BATCHES, ...(limit >= 1 && limit < 512 ? [limit] : [])])].sort((a, b) => a - b);
    const pts = xs.map((b) => ({ b, m: compute(cfg.hw, cfg.chips, { ...cfg, batch: b }) }));
    const firstOom = limit < 512 ? Math.max(1, limit + 0.5) : undefined;
    return {
      animationDuration: 500,
      animationDurationUpdate: 400,
      grid: { left: 56, right: 56, top: 40, bottom: 36 },
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        valueFormatter: (v: number) => `${tps(v)} tok/sn`,
      },
      legend: { top: 0, textStyle: { color: '#cbd5e1', fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      xAxis: { type: 'log', logBase: 2, min: 1, max: 512, name: 'Eşzamanlı kullanıcı', nameLocation: 'middle', nameGap: 24, ...AXIS, splitLine: { show: false } },
      yAxis: [
        { type: 'value', name: 'Toplam tok/sn', ...AXIS },
        { type: 'value', name: 'Kişi başı', ...AXIS, splitLine: { show: false } },
      ],
      series: [
        {
          id: 'sys',
          name: 'Toplam üretim',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          data: pts.map((p) => [p.b, p.m.fits ? p.m.systemTps : null]),
          lineStyle: { width: 3, color: '#a855f7' },
          itemStyle: { color: '#a855f7' },
          areaStyle: { color: grad('rgba(168,85,247,.45)', 'rgba(168,85,247,0)') },
          markArea: firstOom
            ? { silent: true, itemStyle: { color: 'rgba(244,63,94,.08)' }, label: { show: true, color: '#fb7185', fontSize: 10, position: 'insideTop' }, data: [[{ name: 'OOM — belleğe sığmaz', xAxis: firstOom }, { xAxis: 512 }]] }
            : { data: [] },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { formatter: `Siz: ${cfg.batch}`, color: '#fbbf24', fontSize: 10 },
            lineStyle: { color: '#fbbf24', type: 'dashed' },
            data: [{ xAxis: cfg.batch }],
          },
        },
        {
          id: 'user',
          name: 'Kullanıcı başı hız',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 6,
          data: pts.map((p) => [p.b, p.m.fits ? p.m.perUserTps : null]),
          lineStyle: { width: 3, color: '#22d3ee' },
          itemStyle: { color: '#22d3ee' },
        },
      ],
    };
  }, [cfg]);
  return <EChart option={option} />;
}

// ---------------------------------------------------------------------------
// Bağlam uzunluğu: kaç kullanıcıya hizmet verilebilir?
// ---------------------------------------------------------------------------
function ContextChart({ cfg }: { cfg: Config }) {
  const option = useMemo<Option>(() => {
    const pts = CONTEXTS.map((ctx) => ({ ctx, m: compute(cfg.hw, cfg.chips, { ...cfg, context: ctx, prompt: Math.min(cfg.prompt, ctx) }) }));
    return {
      animationDurationUpdate: 400,
      grid: { left: 56, right: 56, top: 40, bottom: 36 },
      tooltip: { ...TOOLTIP, trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#cbd5e1', fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      xAxis: { type: 'category', data: pts.map((p) => tokens(p.ctx)), name: 'Bağlam (token)', nameLocation: 'middle', nameGap: 24, ...AXIS },
      yAxis: [
        { type: 'value', name: 'Max kullanıcı', ...AXIS },
        { type: 'value', name: 'tok/sn', ...AXIS, splitLine: { show: false } },
      ],
      series: [
        {
          id: 'users',
          name: 'Maksimum eşzamanlı kullanıcı',
          type: 'bar',
          barWidth: '55%',
          data: pts.map((p) => ({
            value: p.m.maxBatch,
            itemStyle: { color: p.ctx === cfg.context ? grad('#fbbf24', '#f97316') : grad('#a855f7', 'rgba(99,102,241,.5)'), borderRadius: [6, 6, 0, 0] },
          })),
          label: { show: true, position: 'top', color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono Variable' },
        },
        {
          id: 'speed',
          name: `${cfg.batch} kullanıcıda kişi başı hız`,
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: pts.map((p) => (p.m.fits ? +p.m.perUserTps.toFixed(1) : null)),
          lineStyle: { width: 3, color: '#22d3ee' },
          itemStyle: { color: '#22d3ee' },
        },
      ],
    };
  }, [cfg]);
  return <EChart option={option} />;
}

// ---------------------------------------------------------------------------
// Roofline: bellek mi, işlem gücü mü sınırlıyor?
// ---------------------------------------------------------------------------
function RooflineChart({ cfg, m }: { cfg: Config; m: Metrics }) {
  const option = useMemo<Option>(() => {
    const peak = m.effTflops * 0.65;
    const bwTb = m.effBwGbs / 1000;
    const ridge = peak / bwTb;
    const roof: [number, number][] = [];
    for (let e = -1; e <= 4; e += 0.05) {
      const ai = Math.pow(10, e);
      roof.push([ai, Math.min(peak, ai * bwTb)]);
    }
    const trail = [1, 8, 64, 512].map((b) => {
      const mm = compute(cfg.hw, cfg.chips, { ...cfg, batch: b });
      return { value: [mm.arithIntensity, mm.arithIntensity * mm.bwUsedTbs], name: `batch ${b}` };
    });
    return {
      animationDurationUpdate: 400,
      grid: { left: 60, right: 24, top: 30, bottom: 44 },
      tooltip: {
        ...TOOLTIP,
        trigger: 'item',
        formatter: (p: { seriesName: string; name: string; value: number[] }) =>
          `${p.seriesName}${p.name ? ` · ${p.name}` : ''}<br/>Yoğunluk: <b>${num(p.value[0], 1)}</b> FLOP/byte<br/>Elde edilen: <b>${num(p.value[1], 0)}</b> TFLOPS`,
      },
      xAxis: { type: 'log', min: 0.1, max: 10000, name: 'Aritmetik yoğunluk (FLOP / byte)', nameLocation: 'middle', nameGap: 28, ...AXIS },
      yAxis: { type: 'log', name: 'TFLOPS', ...AXIS, min: Math.max(0.01, peak / 10000) },
      series: [
        {
          id: 'roof',
          name: 'Donanım tavanı',
          type: 'line',
          showSymbol: false,
          data: roof,
          lineStyle: { width: 3, color: '#22d3ee' },
          areaStyle: { color: grad('rgba(34,211,238,.18)', 'rgba(34,211,238,0)') },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: 'rgba(148,163,184,.4)', type: 'dashed' },
            label: { formatter: `Kırılma: ${num(ridge, 0)}`, color: '#94a3b8', fontSize: 10 },
            data: [{ xAxis: ridge }],
          },
        },
        {
          id: 'trail',
          name: 'Farklı batch',
          type: 'scatter',
          symbolSize: 9,
          data: trail,
          itemStyle: { color: 'rgba(168,85,247,.6)' },
          label: { show: true, formatter: '{b}', position: 'right', color: '#a78bfa', fontSize: 10 },
        },
        {
          id: 'you',
          name: 'Sizin kurulumunuz',
          type: 'scatter',
          symbolSize: 18,
          data: [{ value: [m.arithIntensity, m.arithIntensity * m.bwUsedTbs], name: `batch ${cfg.batch}` }],
          itemStyle: { color: '#fbbf24', shadowBlur: 20, shadowColor: '#fbbf24' },
        },
      ],
    };
  }, [cfg, m]);
  return <EChart option={option} />;
}

export function AnalysisCharts({ cfg, m }: { cfg: Config; m: Metrics }) {
  const [tab, setTab] = useState<'batch' | 'ctx' | 'roof'>('batch');
  const desc = {
    batch: 'Kullanıcı sayısı arttıkça toplam üretim katlanır, kişi başı hız yavaşça düşer. Kırmızı alan belleğin yetmediği bölgedir.',
    ctx: 'Bağlam uzadıkça her kullanıcının KV cache\'i büyür; aynı bellekle hizmet verilebilecek kişi sayısı azalır.',
    roof: 'Noktanız eğik çizgideyse bellek bant genişliği, düz tavandaysa işlem gücü sınırlıyor demektir. LLM üretimi neredeyse her zaman eğik bölgededir.',
  }[tab];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Pills
          options={[
            { value: 'batch', label: 'Kullanıcı ölçekleme' },
            { value: 'ctx', label: 'Bağlam → kapasite' },
            { value: 'roof', label: 'Roofline' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <p className="mb-2 text-xs text-slate-400">{desc}</p>
      {tab === 'batch' && <BatchChart cfg={cfg} />}
      {tab === 'ctx' && <ContextChart cfg={cfg} />}
      {tab === 'roof' && <RooflineChart cfg={cfg} m={m} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donanım yarışı: seçili model tüm donanımlarda
// ---------------------------------------------------------------------------
export type RaceMetric = 'single' | 'system' | 'cost';

export function HardwareRace({ cfg, onSelect, category }: { cfg: Config; onSelect: (id: string) => void; category: Category | 'all' }) {
  const [metric, setMetric] = useState<RaceMetric>('single');
  const rows = useMemo(() => {
    return HARDWARE.filter((h) => category === 'all' || h.category === category)
      .map((h) => {
        const chips = Math.min(cfg.chips, h.maxChips);
        const spec = h.id === cfg.hwId ? cfg.hw : h;
        const m = compute(spec, chips, { ...cfg, batch: metric === 'single' ? 1 : cfg.batch });
        const value = !m.fits ? 0 : metric === 'cost' ? m.costPerM : metric === 'single' ? m.perUserTps : m.systemTps;
        return { h, chips, m, value };
      })
      .sort((a, b) => {
        if (a.m.fits !== b.m.fits) return a.m.fits ? 1 : -1;
        return metric === 'cost' ? b.value - a.value : a.value - b.value;
      });
  }, [cfg, metric, category]);

  const option = useMemo<Option>(() => {
    const fmt = metric === 'cost' ? usdSmart : (v: number) => `${tps(v)} tok/sn`;
    const maxVal = Math.max(...rows.map((r) => r.value), 1);
    return {
      animationDurationUpdate: 500,
      grid: { left: 8, right: 70, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (ps: { dataIndex: number }[]) => {
          const r = rows[ps[0].dataIndex];
          return `<b>${r.chips}× ${r.h.name}</b><br/>${r.m.fits ? `${metric === 'cost' ? '1M token' : 'Hız'}: <b>${fmt(r.value)}</b><br/>Bellek: %${num(r.m.utilPct)} · max ${num(r.m.maxBatch)} kullanıcı` : '<span style="color:#fb7185">Belleğe sığmaz (OOM)</span>'}<br/><span style="color:#64748b">Seçmek için tıklayın</span>`;
        },
      },
      xAxis: { type: metric === 'cost' ? 'log' : 'value', ...AXIS, axisLabel: { show: false }, splitLine: { show: false }, min: metric === 'cost' ? Math.max(0.001, Math.min(...rows.filter((r) => r.value > 0).map((r) => r.value)) / 2) : 0 },
      yAxis: {
        type: 'category',
        data: rows.map((r) => `${r.chips > 1 ? `${r.chips}× ` : ''}${r.h.short}`),
        ...AXIS,
        axisLabel: {
          ...AXIS.axisLabel,
          fontSize: 11,
          color: (_: unknown, i: number) => (rows[i]?.h.id === cfg.hwId ? '#fbbf24' : rows[i]?.m.fits ? '#cbd5e1' : '#475569'),
        },
        axisTick: { show: false },
      },
      series: [
        {
          id: 'race',
          type: 'bar',
          barWidth: '62%',
          data: rows.map((r) => ({
            value: r.m.fits ? r.value : metric === 'cost' ? null : maxVal * 0.012,
            itemStyle: {
              color: r.m.fits ? grad(categoryColor(r.h.category) + '55', categoryColor(r.h.category), false) : '#334155',
              borderRadius: [0, 6, 6, 0],
              borderColor: r.h.id === cfg.hwId ? '#fbbf24' : 'transparent',
              borderWidth: 2,
              shadowBlur: r.h.id === cfg.hwId ? 16 : 0,
              shadowColor: '#fbbf24',
            },
          })),
          label: {
            show: true,
            position: 'right',
            fontFamily: 'JetBrains Mono Variable',
            fontSize: 10,
            color: '#e2e8f0',
            formatter: (p: { dataIndex: number }) => (rows[p.dataIndex].m.fits ? fmt(rows[p.dataIndex].value) : 'OOM'),
          },
        },
      ],
    };
  }, [rows, metric, cfg.hwId]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Pills
          options={[
            { value: 'single', label: 'Tek kullanıcı hızı' },
            { value: 'system', label: `${cfg.batch} kullanıcı toplam` },
            { value: 'cost', label: '$ / 1M token (düşük iyi)' },
          ]}
          value={metric}
          onChange={setMetric}
        />
      </div>
      <EChart option={option} height={Math.max(260, rows.length * 24)} onClick={(p) => onSelect(rows[p.dataIndex].h.id)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maliyet: zaman içinde kümülatif harcama (kira vs satın al vs API)
// ---------------------------------------------------------------------------
export function CostTimeline({ cfg, m, completeSystem }: { cfg: Config; m: Metrics; completeSystem: boolean }) {
  const option = useMemo<Option>(() => {
    const c = costAnalysis(cfg.hw, cfg.chips, m, cfg, completeSystem);
    const monthsN = Math.max(12, cfg.years * 12);
    const x = Array.from({ length: monthsN + 1 }, (_, i) => i);
    const series: unknown[] = [
      { id: 'rent', name: 'Bulutta kirala', type: 'line', smooth: true, showSymbol: false, data: x.map((i) => Math.round(c.rentMonthly * i)), lineStyle: { width: 3, color: '#fbbf24' }, areaStyle: { color: grad('rgba(251,191,36,.25)', 'rgba(251,191,36,0)') } },
      { id: 'api', name: 'Hazır API kullan', type: 'line', smooth: true, showSymbol: false, data: x.map((i) => Math.round(c.apiMonthly * i)), lineStyle: { width: 3, color: '#22d3ee', type: 'dashed' } },
    ];
    if (c.capex !== null) {
      series.push({
        id: 'buy',
        name: 'Satın al + elektrik',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: x.map((i) => Math.round(c.capex! + c.powerMonthly * i)),
        lineStyle: { width: 3, color: '#f472b6' },
        areaStyle: { color: grad('rgba(244,114,182,.2)', 'rgba(244,114,182,0)') },
        markPoint:
          c.breakEvenMonths !== null && c.breakEvenMonths <= monthsN
            ? { symbol: 'pin', symbolSize: 44, itemStyle: { color: '#f472b6' }, label: { formatter: 'Başabaş', fontSize: 9, color: '#0a0e1a' }, data: [{ coord: [Math.round(c.breakEvenMonths), Math.round(c.capex! + c.powerMonthly * c.breakEvenMonths)] }] }
            : { data: [] },
      });
    }
    return {
      animationDurationUpdate: 400,
      grid: { left: 64, right: 20, top: 36, bottom: 36 },
      legend: { top: 0, textStyle: { color: '#cbd5e1', fontSize: 11 } },
      tooltip: { ...TOOLTIP, trigger: 'axis', valueFormatter: (v: number) => `$${num(v)}` },
      xAxis: { type: 'category', data: x, name: 'Ay', nameLocation: 'middle', nameGap: 24, ...AXIS, boundaryGap: false },
      yAxis: { type: 'value', ...AXIS, axisLabel: { ...AXIS.axisLabel, formatter: (v: number) => (v >= 1000 ? `$${num(v / 1000)}K` : `$${v}`) } },
      series,
    };
  }, [cfg, m, completeSystem]);
  return <EChart option={option} height={300} />;
}
