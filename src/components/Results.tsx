import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertOctagon, CheckCircle2, Clock, DollarSign, Gauge, HardDrive, Layers, Users, Zap } from 'lucide-react';
import type { Metrics } from '../lib/engine';
import { speedVerdict } from '../lib/engine';
import type { Config } from '../lib/config';
import { bw, gb, ms, num, tps, usdSmart } from '../lib/format';
import { AnimatedNumber, Badge, Card, Hint, useTweened } from './ui';

export function StatusBanner({ m, cfg }: { m: Metrics; cfg: Config }) {
  const needChips = Math.ceil(m.requiredGb / cfg.hw.vram);
  const fits = m.fits;
  return (
    <div
      className={`flex animate-pop flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
        fits ? 'border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-cyan-500/5' : 'border-rose-500/40 bg-gradient-to-r from-rose-500/20 to-fuchsia-500/5'
      }`}
      key={String(fits)}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${fits ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {fits ? <CheckCircle2 className="h-6 w-6" /> : <AlertOctagon className="h-6 w-6" />}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white sm:text-base">{fits ? 'Sığıyor — bu kurulum çalışır' : 'Bellek yetmiyor (OOM)'}</h3>
            <Badge tone={fits ? (m.utilPct > 90 ? 'warn' : 'ok') : 'bad'}>%{num(m.utilPct)} dolu</Badge>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
            {fits
              ? `Aynı anda en fazla ${num(m.maxBatch)} kullanıcıya hizmet verebilir (${num(cfg.context)} token bağlamla).`
              : !m.weightsFit
                ? `Model ağırlıkları bile sığmıyor. En az ${needChips}× çip seçin veya daha düşük bit (ör. Q4) kullanın.`
                : `Model sığıyor ama ${cfg.batch} kullanıcının KV cache'i sığmıyor. Kullanıcı sayısını ${num(m.maxBatch)}'e veya bağlamı düşürün.`}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-left font-mono sm:text-right">
        <div className="text-[11px] text-slate-400">Gereken / mevcut</div>
        <div className="text-lg font-bold text-white">
          {gb(m.requiredGb)} <span className="text-slate-500">/</span> {gb(m.totalVramGb)}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, color, hint }: { icon: ReactNode; label: string; value: ReactNode; sub: ReactNode; color: string; hint: string }) {
  return (
    <Card className="group relative overflow-hidden p-4 transition hover:-translate-y-0.5">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40 ${color}`} />
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5">
          {label} <Hint text={hint} />
        </span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <div className="font-mono text-2xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] text-slate-400">{sub}</div>
    </Card>
  );
}

export function KpiGrid({ m, cfg }: { m: Metrics; cfg: Config }) {
  const dim = !m.fits;
  const v = (node: ReactNode) => (dim ? <span className="text-slate-600">—</span> : node);
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi
        icon={<Zap className="h-4 w-4" />}
        label="Kullanıcı başı hız"
        color="bg-cyan-400"
        hint="Bir kullanıcının ekranında saniyede beliren token sayısı. 1 Türkçe kelime ≈ 2-3 token."
        value={v(<><AnimatedNumber value={m.perUserTps} format={tps} /> <span className="text-sm text-slate-400">tok/sn</span></>)}
        sub={`Token arası gecikme: ${ms(m.itlMs)}`}
      />
      <Kpi
        icon={<Layers className="h-4 w-4" />}
        label="Toplam üretim"
        color="bg-violet-500"
        hint="Sistemin tüm kullanıcılar için saniyede ürettiği toplam token (throughput)."
        value={v(<><AnimatedNumber value={m.systemTps} format={(x) => num(x)} /> <span className="text-sm text-slate-400">tok/sn</span></>)}
        sub={`${cfg.batch} kullanıcı × ${tps(m.perUserTps)} tok/sn`}
      />
      <Kpi
        icon={<Clock className="h-4 w-4" />}
        label="İlk token (TTFT)"
        color="bg-pink-500"
        hint="Soruyu gönderdikten sonra ilk kelimenin gelmesine kadar geçen süre. İstem uzadıkça artar."
        value={v(<AnimatedNumber value={m.ttftMs} format={ms} />)}
        sub={dim ? 'Model sığmıyor' : `500 token'lık yanıt: ${num(m.answer500Sec, 1)} sn`}
      />
      <Kpi
        icon={<DollarSign className="h-4 w-4" />}
        label="1M token maliyeti"
        color="bg-amber-400"
        hint="Bulutta kiralama fiyatıyla, tüm kullanıcılar sürekli yük altındayken 1 milyon token üretmenin maliyeti."
        value={v(<AnimatedNumber value={m.costPerM} format={usdSmart} />)}
        sub={`Kira: ${usdSmart(m.hourlyCost)}/saat · ${num(m.tokPerWatt, 2)} tok/sn/W`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hız göstergesi + canlı token akışı önizlemesi
// ---------------------------------------------------------------------------

const SAMPLE =
  'Büyük dil modelleri her yeni token için model ağırlıklarının tamamını bellekten okumak zorundadır. Bu yüzden çıkarım hızını çoğu zaman işlem gücü değil, bellek bant genişliği belirler. 70 milyar parametreli 8-bit bir model yaklaşık 70 GB yer kaplar; saniyede 100 token üretmek için 7 TB/sn veri akışı gerekir. Kuantizasyon, toplu işleme ve spekülatif çözme bu duvarı aşmanın en etkili yollarıdır. ';
// Türkçe metni kaba token parçalarına böl (ortalama ~3.5 karakter/token).
const TOKENS = SAMPLE.match(/.{1,4}(\s|$)|.{1,4}/g) ?? [SAMPLE];

function SpeedGauge({ value, max }: { value: number; max: number }) {
  const t = useTweened(value, 600);
  const frac = Math.min(1, Math.log10(1 + t) / Math.log10(1 + max));
  const R = 70;
  const arc = Math.PI * R;
  return (
    <svg viewBox="0 0 180 110" className="h-auto w-full max-w-[220px]" role="img" aria-label={`Hız ${tps(value)} token/sn`}>
      <defs>
        <linearGradient id="gauge" x1="0" x2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="0.35" stopColor="#fbbf24" />
          <stop offset="0.65" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <filter id="gglow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="rgb(42 53 88 / .7)" strokeWidth="12" strokeLinecap="round" />
      <path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="url(#gauge)" strokeWidth="12" strokeLinecap="round" strokeDasharray={arc} strokeDashoffset={arc * (1 - frac)} filter="url(#gglow)" />
      <text x="90" y="80" textAnchor="middle" className="fill-white font-mono text-[26px] font-bold">
        {tps(t)}
      </text>
      <text x="90" y="98" textAnchor="middle" className="fill-slate-400 text-[10px]">
        token / saniye
      </text>
    </svg>
  );
}

function TokenStream({ rate, active }: { rate: number; active: boolean }) {
  const [count, setCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setCount(0);
    if (!active || rate <= 0) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const visualRate = Math.min(rate, 400);
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * visualRate;
      last = now;
      if (acc >= 1) {
        const n = Math.floor(acc);
        acc -= n;
        setCount((c) => (c + n >= TOKENS.length * 2 ? 0 : c + n));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rate, active]);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [count]);
  const text = Array.from({ length: Math.min(count, TOKENS.length * 2) }, (_, i) => TOKENS[i % TOKENS.length]).join('');
  return (
    <div ref={boxRef} className="h-28 overflow-hidden rounded-xl border border-white/5 bg-ink-950/70 p-3 font-mono text-[12px] leading-relaxed text-slate-300">
      {active ? (
        <>
          {text}
          <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-neon-cyan" />
        </>
      ) : (
        <span className="text-rose-300">Model belleğe sığmadığı için çalışmaz.</span>
      )}
    </div>
  );
}

export function SpeedPreview({ m }: { m: Metrics }) {
  const verdict = speedVerdict(m.perUserTps);
  const toneCls = { bad: 'text-rose-300', warn: 'text-amber-300', ok: 'text-cyan-300', great: 'text-violet-300' }[verdict.tone];
  return (
    <Card className="p-5" glow>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <Gauge className="h-4 w-4 text-neon-cyan" /> Canlı hız önizlemesi
        </h3>
        <Hint text="Aşağıdaki metin, hesaplanan kullanıcı başı hızda akar. Böylece sayıların gerçekte nasıl hissettirdiğini görebilirsiniz." />
      </div>
      <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center">
          <SpeedGauge value={m.fits ? m.perUserTps : 0} max={300} />
          <div className={`text-center text-xs font-semibold ${m.fits ? toneCls : 'text-rose-300'}`}>{m.fits ? verdict.label : 'Çalışmaz'}</div>
        </div>
        <TokenStream rate={m.perUserTps} active={m.fits} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bellek dağılımı çubuğu + Roofline formülü
// ---------------------------------------------------------------------------

export function MemoryBreakdown({ m, cfg }: { m: Metrics; cfg: Config }) {
  const denom = Math.max(m.totalVramGb, m.requiredGb);
  const parts = [
    { label: 'Model ağırlıkları', v: m.weightsGb, cls: 'from-cyan-400 to-sky-500', dot: 'bg-cyan-400' },
    { label: `KV cache (${cfg.batch} kişi)`, v: m.kvTotalGb, cls: 'from-violet-500 to-fuchsia-500', dot: 'bg-violet-500' },
    { label: 'Çalışma alanı', v: m.overheadGb, cls: 'from-amber-400 to-orange-500', dot: 'bg-amber-400' },
  ];
  const free = Math.max(0, m.totalVramGb - m.requiredGb);
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <HardDrive className="h-4 w-4 text-neon-violet" /> Bellek dağılımı
        </h3>
        <span className="font-mono text-xs text-slate-400">
          {cfg.chips}× {gb(cfg.hw.vram)} = {gb(m.totalVramGb)}
        </span>
      </div>
      <div className="relative flex h-9 overflow-hidden rounded-xl border border-white/10 bg-ink-900">
        {parts.map((p) => (
          <div
            key={p.label}
            className={`flex h-full items-center justify-center overflow-hidden bg-gradient-to-r ${p.cls} text-[10px] font-bold text-ink-950 transition-[width] duration-500 ease-out`}
            style={{ width: `${(p.v / denom) * 100}%` }}
          >
            {(p.v / denom) * 100 > 9 ? gb(p.v) : ''}
          </div>
        ))}
        {!m.fits && <div className="absolute inset-y-0 border-l-2 border-dashed border-white" style={{ left: `${(m.totalVramGb / denom) * 100}%` }} title="Bellek sınırı" />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 text-slate-400">
            <span className={`h-2.5 w-2.5 rounded-sm ${p.dot}`} />
            {p.label}: <span className="font-mono font-semibold text-slate-200">{gb(p.v)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2.5 w-2.5 rounded-sm border border-white/20 bg-ink-900" />
          {m.fits ? 'Boş' : 'Aşım'}: <span className={`font-mono font-semibold ${m.fits ? 'text-emerald-300' : 'text-rose-300'}`}>{gb(m.fits ? free : m.requiredGb - m.totalVramGb)}</span>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/5 bg-ink-950/60 p-3.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label">Darboğaz denklemi (her token adımı)</span>
          {m.computeBound ? <Badge tone="warn">İşlem gücü sınırlı</Badge> : <Badge tone="info">Bellek bant genişliği sınırlı</Badge>}
        </div>
        <p className="font-mono text-[12px] leading-relaxed text-slate-300">
          <span className="font-bold text-neon-cyan">{bw(m.effBwGbs)}</span> ÷ [<span className="font-bold text-cyan-300">{gb(m.bytesPerStepGb - m.kvTotalGb)}</span> ağırlık +{' '}
          <span className="font-bold text-violet-300">{gb(m.kvTotalGb)}</span> KV] {cfg.spec > 1 && <>× <span className="text-pink-300">{cfg.spec} spec</span> </>}={' '}
          <span className="font-bold text-white">{tps(m.perUserTps)} tok/sn</span> × <span className="text-amber-300">{cfg.batch}</span> ={' '}
          <span className="font-bold text-emerald-300 underline decoration-dotted">{num(m.systemTps)} tok/sn toplam</span>
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Bellek okuma {ms(m.memTimeMs)} · Hesaplama {ms(m.computeTimeMs)} · Kullanılan bant genişliği {num(m.bwUsedTbs, 2)} TB/sn
          {cfg.moe && cfg.batch > 1 && ` · MoE: ${cfg.batch} kullanıcıda farklı uzmanlar devreye girer, okunan ağırlık ${gb(m.activeReadGb)} → ${gb(m.bytesPerStepGb - m.kvTotalGb)}`}
        </p>
      </div>
    </Card>
  );
}

// Mobilde ayar panelleri uzun olduğu için sonucu ekranın altında sürekli gösterir.
export function MobileSummary({ m }: { m: Metrics }) {
  return (
    <a
      href="#hesapla-s"
      className={`fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 font-mono text-xs shadow-2xl backdrop-blur-xl lg:hidden ${
        m.fits ? 'border-emerald-400/30 bg-ink-900/90' : 'border-rose-500/40 bg-rose-950/90'
      }`}
    >
      <span className={m.fits ? 'text-emerald-300' : 'text-rose-300'}>{m.fits ? `✓ %${num(m.utilPct)}` : '✗ OOM'}</span>
      <span className="text-neon-cyan">{m.fits ? `${tps(m.perUserTps)} tok/sn` : '—'}</span>
      <span className="flex items-center gap-1 text-slate-300">
        <Users className="h-3.5 w-3.5" /> {num(m.maxBatch)}
      </span>
      <span className="text-neon-amber">{m.fits ? usdSmart(m.costPerM) : '—'}</span>
    </a>
  );
}
