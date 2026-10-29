import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

export function Card({ children, className = '', glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return <div className={`glass rounded-2xl ${glow ? 'glow-border' : ''} ${className}`}>{children}</div>;
}

export function PanelHeader({ icon, title, badge, accent = 'text-neon-cyan' }: { icon: ReactNode; title: string; badge?: ReactNode; accent?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/5 pb-3">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-white/5 ${accent}`}>{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
      </div>
      {badge}
    </div>
  );
}

export function SectionHeading({ id, kicker, title, desc }: { id: string; kicker: string; title: ReactNode; desc?: string }) {
  return (
    <div id={id} className="mb-6 max-w-3xl">
      <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{kicker}</div>
      <h2 className="section-title">{title}</h2>
      {desc && <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">{desc}</p>}
    </div>
  );
}

export function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info className="h-3.5 w-3.5 cursor-help text-slate-500 transition group-hover:text-neon-cyan" aria-label={text} />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-800 p-2.5 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function Pills<T extends string | number>({
  options,
  value,
  onChange,
  cols,
  isDisabled,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: string;
  isDisabled?: (v: T) => boolean;
}) {
  return (
    <div className={cols ? `grid gap-1.5 ${cols}` : 'flex flex-wrap gap-1.5'}>
      {options.map((o) => {
        const disabled = isDisabled?.(o.value) ?? false;
        return (
          <button
            key={String(o.value)}
            type="button"
            title={o.title}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`pill ${o.value === value ? 'pill-active' : ''} ${disabled ? 'cursor-not-allowed opacity-30 hover:bg-white/[0.04]' : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  min,
  max,
  value,
  onChange,
  log = false,
  step = 1,
  round = (v) => Math.round(v),
  ariaLabel,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  log?: boolean;
  step?: number;
  round?: (v: number) => number;
  ariaLabel: string;
}) {
  const RES = 1000;
  const toPos = (v: number) => (log ? ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * RES : v);
  const fromPos = (p: number) => (log ? Math.exp(Math.log(min) + (p / RES) * (Math.log(max) - Math.log(min))) : p);
  const pos = toPos(Math.min(max, Math.max(min, value)));
  const pct = log ? (pos / RES) * 100 : ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      min={log ? 0 : min}
      max={log ? RES : max}
      step={log ? 1 : step}
      value={pos}
      style={{ ['--pct' as string]: `${pct}%` }}
      onChange={(e) => onChange(Math.min(max, Math.max(min, round(fromPos(Number(e.target.value))))))}
    />
  );
}

export function NumField({
  label,
  value,
  onChange,
  suffix,
  accent = 'text-white',
  step = 1,
  allowEmpty = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  accent?: string;
  step?: number;
  allowEmpty?: boolean;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  useEffect(() => setDraft(value === null ? '' : String(value)), [value]);
  return (
    <label className="block rounded-xl border border-white/5 bg-ink-900/70 px-3 py-2 transition focus-within:border-neon-cyan/50">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <span className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={draft}
          placeholder={allowEmpty ? '—' : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const v = parseFloat(e.target.value);
            if (e.target.value === '' && allowEmpty) onChange(null);
            else if (Number.isFinite(v) && v > 0) onChange(v);
          }}
          className={`w-full min-w-0 bg-transparent font-mono text-sm font-bold outline-none ${accent}`}
        />
        {suffix && <span className="shrink-0 text-[10px] text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}

// Değer değiştiğinde sayıyı yumuşakça hedefe kaydırır.
export function useTweened(target: number, duration = 450) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const valRef = useRef(target);
  useEffect(() => {
    if (!Number.isFinite(target)) {
      setVal(target);
      valRef.current = target;
      return;
    }
    fromRef.current = Number.isFinite(valRef.current) ? valRef.current : target;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const v = fromRef.current + (target - fromRef.current) * e;
      valRef.current = v;
      setVal(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const v = useTweened(value);
  return <>{format(v)}</>;
}

export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'info' | 'violet'; children: ReactNode }) {
  const tones = {
    ok: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
    warn: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    bad: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    info: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30',
    violet: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}
