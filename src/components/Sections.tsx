import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowDownUp, Award, BatteryCharging, Cloud, Crown, Rocket, Search, ShoppingCart, Sparkles, Wallet } from 'lucide-react';
import { CATEGORIES, HARDWARE, categoryColor, categoryLabel, findHardware, type Category } from '../data/hardware';
import { findModel } from '../data/models';
import { compute, costAnalysis, recommend, type Metrics, type RecSort } from '../lib/engine';
import { withHardware, type Config } from '../lib/config';
import { bw, gb, months, num, tokens, tps, usd, usdSmart } from '../lib/format';
import type { SetCfg } from './Controls';
import { Badge, Card, Hint, NumField, Pills, Slider } from './ui';

const modelLabel = (cfg: Config) => (findModel(cfg.modelId)?.name ?? `Özel ${num(cfg.totalB)}B`) + ` @ ${cfg.weightBits}-bit`;

// ---------------------------------------------------------------------------
// Donanım danışmanı
// ---------------------------------------------------------------------------
const TPS_TARGETS = [5, 10, 20, 40, 80];

export function Advisor({ cfg, set, onApplied }: { cfg: Config; set: SetCfg; onApplied: () => void }) {
  const [users, setUsers] = useState(Math.max(1, cfg.batch));
  const [minTps, setMinTps] = useState(20);
  const [sort, setSort] = useState<RecSort>('rent');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const dUsers = useDeferredValue(users);
  const recs = useMemo(
    () => recommend(cfg, dUsers, minTps, sort, cfg.hoursPerDay).filter((r) => cat === 'all' || r.hw.category === cat),
    [cfg, dUsers, minTps, sort, cat],
  );
  const shown = recs.slice(0, 9);
  const fastest = recs.reduce<(typeof recs)[number] | null>((a, r) => (!a || r.m.perUserTps > a.m.perUserTps ? r : a), null);
  const cheapest = recs.reduce<(typeof recs)[number] | null>((a, r) => (!a || r.monthlyRent < a.monthlyRent ? r : a), null);
  const efficient = recs.reduce<(typeof recs)[number] | null>((a, r) => (!a || r.m.tokPerWatt > a.m.tokPerWatt ? r : a), null);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="space-y-5 p-5 lg:col-span-4">
        <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-slate-400">
          Model: <span className="font-semibold text-white">{modelLabel(cfg)}</span>
          <br />
          Bağlam: <span className="font-mono text-slate-200">{tokens(cfg.context)}</span> · KV {cfg.kvBits}-bit
          <p className="mt-1 text-[11px] text-slate-500">Modeli yukarıdaki hesaplayıcıdan değiştirebilirsiniz.</p>
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span className="label">Aynı anda kaç kişi?</span>
            <span className="font-mono text-xs font-bold text-neon-amber">{users} kişi</span>
          </div>
          <Slider ariaLabel="Kullanıcı sayısı" log min={1} max={512} value={users} onChange={setUsers} />
        </div>
        <div>
          <span className="label mb-1.5 flex items-center gap-1.5">
            Kişi başı minimum hız <Hint text="5 tok/sn ≈ okuma hızı, 20 tok/sn ≈ ChatGPT benzeri akıcılık, 40+ tok/sn kod üretimi ve ajanlar için idealdir." />
          </span>
          <Pills cols="grid-cols-5" options={TPS_TARGETS.map((t) => ({ value: t, label: `${t}` }))} value={minTps} onChange={setMinTps} />
          <p className="mt-1 text-right font-mono text-[10px] text-slate-500">token / saniye</p>
        </div>
        <div>
          <span className="label mb-1.5 block">Önceliğiniz</span>
          <Pills
            cols="grid-cols-2"
            options={[
              { value: 'rent', label: 'En ucuz kira' },
              { value: 'buy', label: 'En ucuz satın alma' },
              { value: 'speed', label: 'En hızlı' },
              { value: 'efficiency', label: 'Enerji verimi' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>
        <div>
          <span className="label mb-1.5 block">Donanım ailesi</span>
          <Pills options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} value={cat} onChange={setCat} />
        </div>
      </Card>

      <div className="lg:col-span-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-neon-pink" />
          <span>
            <b className="text-white">{recs.length}</b> kurulum hedefinizi karşılıyor
          </span>
        </div>
        {shown.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-400">
            Bu hedefi karşılayan kurulum yok. Kullanıcı sayısını veya hız hedefini düşürün, daha düşük bit (Q4) seçin ya da bağlamı kısaltın.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r, i) => (
              <Card key={r.hw.id} className="group relative flex flex-col overflow-hidden p-4 transition hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${categoryColor(r.hw.category)}, transparent)` }} />
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: categoryColor(r.hw.category) }}>
                      {categoryLabel(r.hw.category)}
                    </div>
                    <div className="font-semibold leading-tight text-white">
                      {r.chips > 1 && <span className="font-mono text-neon-cyan">{r.chips}× </span>}
                      {r.hw.name}
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-600">#{i + 1}</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {r === cheapest && <Badge tone="warn"><Wallet className="h-3 w-3" /> En ucuz</Badge>}
                  {r === fastest && <Badge tone="info"><Rocket className="h-3 w-3" /> En hızlı</Badge>}
                  {r === efficient && <Badge tone="ok"><BatteryCharging className="h-3 w-3" /> En verimli</Badge>}
                </div>
                <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <dt className="text-slate-500">Kişi başı</dt>
                  <dd className="text-right font-mono font-bold text-neon-cyan">{tps(r.m.perUserTps)} tok/sn</dd>
                  <dt className="text-slate-500">Toplam</dt>
                  <dd className="text-right font-mono text-slate-200">{num(r.m.systemTps)} tok/sn</dd>
                  <dt className="text-slate-500">Bellek</dt>
                  <dd className="text-right font-mono text-slate-200">%{num(r.m.utilPct)} / {gb(r.m.totalVramGb)}</dd>
                  <dt className="text-slate-500">Kira / ay</dt>
                  <dd className="text-right font-mono text-neon-amber">{usd(r.monthlyRent)}</dd>
                  <dt className="text-slate-500">Satın alma</dt>
                  <dd className="text-right font-mono text-neon-pink">{r.capex === null ? 'Yalnızca bulut' : `~${usd(r.capex)}`}</dd>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    set((c) => ({ ...withHardware(c, r.hw.id), chips: r.chips, batch: users }));
                    onApplied();
                  }}
                  className="pill mt-3 w-full text-center group-hover:border-neon-violet/60 group-hover:bg-neon-violet/20 group-hover:text-white"
                >
                  Bu kurulumu hesapla →
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maliyet: kirala / satın al / API
// ---------------------------------------------------------------------------
export function CostSection({ cfg, set, m, Timeline }: { cfg: Config; set: SetCfg; m: Metrics; Timeline: React.ComponentType<{ cfg: Config; m: Metrics; completeSystem: boolean }> }) {
  const hw = findHardware(cfg.hwId)!;
  const completeSystem = hw.category === 'apple' || hw.category === 'workstation';
  const c = costAnalysis(cfg.hw, cfg.chips, m, cfg, completeSystem);
  const winner = { rent: 'Bulutta kiralamak', buy: 'Satın almak', api: 'Hazır API kullanmak' }[c.cheapest];
  const cards = [
    { key: 'rent', icon: <Cloud className="h-5 w-5" />, title: 'Bulutta kirala', color: 'from-amber-400/25', monthly: c.rentMonthly, perM: c.rentPerM, sub: `${usdSmart(cfg.hw.rent * cfg.chips)}/saat × ${cfg.hoursPerDay} saat × 30 gün` },
    {
      key: 'buy',
      icon: <ShoppingCart className="h-5 w-5" />,
      title: 'Satın al',
      color: 'from-pink-500/25',
      monthly: c.ownedMonthly,
      perM: c.ownedPerM,
      sub: c.capex === null ? 'Bu donanım satılmıyor (yalnızca bulut)' : `Yatırım ~${usd(c.capex)} · ${cfg.years} yılda amorti + elektrik ${usd(c.powerMonthly)}/ay`,
    },
    { key: 'api', icon: <Sparkles className="h-5 w-5" />, title: 'Hazır API', color: 'from-cyan-400/25', monthly: c.apiMonthly, perM: cfg.apiPricePerM, sub: `Aynı token hacmi ${usdSmart(cfg.apiPricePerM)}/1M fiyatla` },
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="space-y-3 p-5 lg:col-span-4">
        <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-slate-400">
          Kurulum: <span className="font-semibold text-white">{cfg.chips}× {hw.name}</span>
          <br />
          {modelLabel(cfg)} · {cfg.batch} kullanıcı ·{' '}
          <span className="font-mono text-slate-200">{m.fits ? `${num(m.systemTps)} tok/sn` : 'sığmıyor'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Elektrik" suffix="$/kWh" step={0.01} accent="text-neon-lime" value={cfg.kwhPrice} onChange={(v) => v && set((x) => ({ ...x, kwhPrice: v }))} />
          <NumField label="Günlük kullanım" suffix="saat" accent="text-neon-cyan" value={cfg.hoursPerDay} onChange={(v) => v && set((x) => ({ ...x, hoursPerDay: Math.min(24, v) }))} />
          <NumField label="Amortisman" suffix="yıl" value={cfg.years} onChange={(v) => v && set((x) => ({ ...x, years: Math.min(10, v) }))} />
          <NumField label="API fiyatı" suffix="$/1M" step={0.05} accent="text-neon-pink" value={cfg.apiPricePerM} onChange={(v) => v && set((x) => ({ ...x, apiPricePerM: v }))} />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Varsayımlar: sistem sürekli dolu çalışır, PUE 1.25 (soğutma), komple sistem olmayan kartlara %20 platform maliyeti eklenir. Kira ve satın alma fiyatları donanım panelinden düzenlenebilir.
        </p>
      </Card>
      <div className="space-y-4 lg:col-span-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((k) => (
            <Card key={k.key} className={`relative overflow-hidden p-4 ${c.cheapest === k.key ? 'glow-border' : ''}`}>
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${k.color} to-transparent opacity-60`} />
              <div className="relative">
                <div className="mb-2 flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {k.icon} {k.title}
                  </span>
                  {c.cheapest === k.key && <Crown className="h-4 w-4 text-neon-amber" />}
                </div>
                <div className="font-mono text-2xl font-bold text-white">{k.monthly === null ? '—' : usd(k.monthly)}<span className="text-xs text-slate-400"> /ay</span></div>
                <div className="font-mono text-xs text-slate-300">{k.perM === null ? '—' : `${usdSmart(k.perM)} / 1M token`}</div>
                <div className="mt-2 text-[11px] leading-snug text-slate-400">{k.sub}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Award className="h-4 w-4 text-neon-amber" /> Bu kullanımda en ekonomik yol: <b className="text-white">{winner}</b>
            </div>
            <Badge tone="violet">Başabaş: {months(c.breakEvenMonths)}</Badge>
          </div>
          <Timeline cfg={cfg} m={m} completeSystem={completeSystem} />
          <p className="mt-2 text-[11px] text-slate-500">Aylık token hacmi: {num(c.tokensPerMonthM)} milyon. Daha az saat kullanıyorsanız satın almanın başabaş süresi uzar, API daha cazip hale gelir.</p>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Karşılaştırma tablosu
// ---------------------------------------------------------------------------
type SortKey = 'name' | 'vram' | 'bw' | 'single' | 'system' | 'users' | 'cost' | 'price';

export function CompareTable({ cfg, onSelect, category }: { cfg: Config; onSelect: (id: string) => void; category: Category | 'all' }) {
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('single');
  const [desc, setDesc] = useState(true);
  const rows = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = HARDWARE.filter((h) => (category === 'all' || h.category === category) && (!query || h.name.toLowerCase().includes(query))).map((h) => {
      const chips = Math.min(cfg.chips, h.maxChips);
      const spec = h.id === cfg.hwId ? cfg.hw : h;
      const one = compute(spec, chips, { ...cfg, batch: 1 });
      const many = compute(spec, chips, cfg);
      return { h, chips, one, many, price: spec.price === null ? null : spec.price * chips };
    });
    const val = (r: (typeof list)[number]): number | string => {
      switch (sortKey) {
        case 'name': return r.h.name;
        case 'vram': return r.one.totalVramGb;
        case 'bw': return r.one.effBwGbs;
        case 'single': return r.one.fits ? r.one.perUserTps : -1;
        case 'system': return r.many.fits ? r.many.systemTps : -1;
        case 'users': return r.one.maxBatch;
        case 'cost': return r.many.fits ? -r.many.costPerM : -Infinity;
        case 'price': return r.price === null ? -Infinity : -r.price;
      }
    };
    return list.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'tr') : (va as number) - (vb as number);
      return desc ? -cmp : cmp;
    });
  }, [cfg, q, sortKey, desc, category]);

  const Th = ({ k, children, right = true }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={`whitespace-nowrap px-3 py-2.5 ${right ? 'text-right' : 'text-left'}`}>
      <button type="button" onClick={() => (sortKey === k ? setDesc(!desc) : (setSortKey(k), setDesc(true)))} className={`inline-flex items-center gap-1 hover:text-white ${sortKey === k ? 'text-neon-cyan' : ''}`}>
        {children} <ArrowDownUp className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-4">
        <div className="text-xs text-slate-400">
          {modelLabel(cfg)} · {cfg.batch} kullanıcı · {tokens(cfg.context)} bağlam · en fazla {cfg.chips}× çip
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Donanım ara…" className="field w-56 py-2 pl-8 text-xs" />
        </label>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-xs [&_td]:whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-ink-800/95 text-[11px] uppercase tracking-wider text-slate-400 backdrop-blur">
            <tr>
              <Th k="name" right={false}>Donanım</Th>
              <Th k="vram">Bellek</Th>
              <Th k="bw">Bant gen.</Th>
              <th className="px-3 py-2.5 text-center">Durum</th>
              <Th k="single">1 kişi</Th>
              <Th k="system">{cfg.batch} kişi toplam</Th>
              <Th k="users">Max kişi</Th>
              <Th k="cost">$/1M</Th>
              <Th k="price">Satın alma</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {rows.map((r) => {
              const sel = r.h.id === cfg.hwId;
              return (
                <tr key={r.h.id} onClick={() => onSelect(r.h.id)} className={`cursor-pointer transition ${sel ? 'bg-amber-400/10' : 'hover:bg-white/[0.03]'}`}>
                  <td className="whitespace-nowrap px-3 py-2.5 font-sans">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: categoryColor(r.h.category) }} />
                    {r.chips > 1 && <span className="font-mono text-neon-cyan">{r.chips}× </span>}
                    <span className={sel ? 'font-semibold text-neon-amber' : 'text-white'}>{r.h.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-200">{gb(r.one.totalVramGb)}</td>
                  <td className="px-3 py-2.5 text-right text-cyan-300">{bw(r.h.bw * r.chips)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {r.many.fits ? <Badge tone="ok">%{num(r.many.utilPct)}</Badge> : r.one.fits ? <Badge tone="warn">{num(r.one.maxBatch)} kişiye kadar</Badge> : <Badge tone="bad">OOM</Badge>}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${r.one.fits ? 'text-neon-cyan' : 'text-slate-600'}`}>{r.one.fits ? tps(r.one.perUserTps) : '—'}</td>
                  <td className={`px-3 py-2.5 text-right ${r.many.fits ? 'text-violet-300' : 'text-slate-600'}`}>{r.many.fits ? num(r.many.systemTps) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{num(r.one.maxBatch)}</td>
                  <td className={`px-3 py-2.5 text-right ${r.many.fits ? 'text-amber-300' : 'text-slate-600'}`}>{r.many.fits ? usdSmart(r.many.costPerM) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-pink-300">{r.price === null ? 'Bulut' : usd(r.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
