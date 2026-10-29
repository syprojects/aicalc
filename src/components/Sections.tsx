import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowDownUp, Award, BatteryCharging, Cloud, Crown, Rocket, Search, ShoppingCart, Sparkles, Wallet } from 'lucide-react';
import { CATEGORIES, HARDWARE, categoryColor, findHardware, type Category } from '../data/hardware';
import { findModel } from '../data/models';
import { compute, costAnalysis, recommend, type Metrics, type RecSort } from '../lib/engine';
import { withHardware, type Config } from '../lib/config';
import { bw, gb, months, num, pct, tokSec, tokens, tps, usd, usdSmart } from '../lib/format';
import { useI18n, type Dict } from '../lib/i18n';
import type { SetCfg } from './Controls';
import { Badge, Card, Hint, NumField, Pills, Slider } from './ui';

export const modelLabel = (cfg: Config, t: Dict) => (findModel(cfg.modelId)?.name ?? t.model.customName(num(cfg.totalB))) + ` @ ${cfg.weightBits}-bit`;

// ---------------------------------------------------------------------------
// Donanım danışmanı
// ---------------------------------------------------------------------------
const TPS_TARGETS = [5, 10, 20, 40, 80];

export function Advisor({ cfg, set, onApplied }: { cfg: Config; set: SetCfg; onApplied: () => void }) {
  const { t } = useI18n();
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
  const ts = tokSec();

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Card className="space-y-5 p-5 lg:col-span-4">
        <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-slate-400">
          {t.advisor.model}: <span className="font-semibold text-white">{modelLabel(cfg, t)}</span>
          <br />
          {t.advisor.context}: <span className="font-mono text-slate-200">{tokens(cfg.context)}</span> · KV {cfg.kvBits}-bit
          <p className="mt-1 text-[11px] text-slate-500">{t.advisor.changeHint}</p>
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span className="label">{t.advisor.howMany}</span>
            <span className="font-mono text-xs font-bold text-neon-amber">{t.load.usersVal(users)}</span>
          </div>
          <Slider ariaLabel={t.advisor.howMany} log min={1} max={512} value={users} onChange={setUsers} />
        </div>
        <div>
          <span className="label mb-1.5 flex items-center gap-1.5">
            {t.advisor.minSpeed} <Hint text={t.advisor.minSpeedHint} />
          </span>
          <Pills cols="grid-cols-5" options={TPS_TARGETS.map((v) => ({ value: v, label: `${v}` }))} value={minTps} onChange={setMinTps} />
          <p className="mt-1 text-right font-mono text-[10px] text-slate-500">{t.advisor.perSecond}</p>
        </div>
        <div>
          <span className="label mb-1.5 block">{t.advisor.priority}</span>
          <Pills
            cols="grid-cols-2"
            options={(['rent', 'buy', 'speed', 'efficiency'] as const).map((k) => ({ value: k, label: t.advisor.sorts[k] }))}
            value={sort}
            onChange={setSort}
          />
        </div>
        <div>
          <span className="label mb-1.5 block">{t.advisor.family}</span>
          <Pills options={CATEGORIES.map((c) => ({ value: c.id, label: t.cat[c.id] }))} value={cat} onChange={setCat} />
        </div>
      </Card>

      <div className="lg:col-span-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-neon-pink" />
          <span>{t.advisor.matches(recs.length)}</span>
        </div>
        {shown.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-400">{t.advisor.none}</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r, i) => (
              <Card key={r.hw.id} className="group relative flex flex-col overflow-hidden p-4 transition hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${categoryColor(r.hw.category)}, transparent)` }} />
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: categoryColor(r.hw.category) }}>
                      {t.cat[r.hw.category]}
                    </div>
                    <div className="font-semibold leading-tight text-white">
                      {r.chips > 1 && <span className="font-mono text-neon-cyan">{r.chips}× </span>}
                      {r.hw.name}
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-600">#{i + 1}</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {r === cheapest && <Badge tone="warn"><Wallet className="h-3 w-3" /> {t.advisor.cheapest}</Badge>}
                  {r === fastest && <Badge tone="info"><Rocket className="h-3 w-3" /> {t.advisor.fastest}</Badge>}
                  {r === efficient && <Badge tone="ok"><BatteryCharging className="h-3 w-3" /> {t.advisor.efficient}</Badge>}
                </div>
                <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <dt className="text-slate-500">{t.advisor.perUser}</dt>
                  <dd className="text-right font-mono font-bold text-neon-cyan">{tps(r.m.perUserTps)} {ts}</dd>
                  <dt className="text-slate-500">{t.advisor.total}</dt>
                  <dd className="text-right font-mono text-slate-200">{num(r.m.systemTps)} {ts}</dd>
                  <dt className="text-slate-500">{t.advisor.memory}</dt>
                  <dd className="text-right font-mono text-slate-200">{pct(r.m.utilPct)} / {gb(r.m.totalVramGb)}</dd>
                  <dt className="text-slate-500">{t.advisor.rentMonth}</dt>
                  <dd className="text-right font-mono text-neon-amber">{usd(r.monthlyRent)}</dd>
                  <dt className="text-slate-500">{t.advisor.buy}</dt>
                  <dd className="text-right font-mono text-neon-pink">{r.capex === null ? t.advisor.cloudOnly : `~${usd(r.capex)}`}</dd>
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    set((c) => ({ ...withHardware(c, r.hw.id), chips: r.chips, batch: users }));
                    onApplied();
                  }}
                  className="pill mt-3 w-full text-center group-hover:border-neon-violet/60 group-hover:bg-neon-violet/20 group-hover:text-white"
                >
                  {t.advisor.apply}
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
  const { t } = useI18n();
  const hw = findHardware(cfg.hwId)!;
  const completeSystem = hw.category === 'apple' || hw.category === 'workstation';
  const c = costAnalysis(cfg.hw, cfg.chips, m, cfg, completeSystem);
  const cards = [
    { key: 'rent', icon: <Cloud className="h-5 w-5" />, title: t.cost.rent, color: 'from-amber-400/25', monthly: c.rentMonthly, perM: c.rentPerM, sub: t.cost.rentSub(usdSmart(cfg.hw.rent * cfg.chips), cfg.hoursPerDay) },
    {
      key: 'buy',
      icon: <ShoppingCart className="h-5 w-5" />,
      title: t.cost.buy,
      color: 'from-pink-500/25',
      monthly: c.ownedMonthly,
      perM: c.ownedPerM,
      sub: c.capex === null ? t.cost.notForSale : t.cost.buySub(usd(c.capex), cfg.years, usd(c.powerMonthly)),
    },
    { key: 'api', icon: <Sparkles className="h-5 w-5" />, title: t.cost.apiCard, color: 'from-cyan-400/25', monthly: c.apiMonthly, perM: cfg.apiPricePerM, sub: t.cost.apiSub(usdSmart(cfg.apiPricePerM)) },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Card className="space-y-3 p-5 lg:col-span-4">
        <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-slate-400">
          {t.cost.setup}: <span className="font-semibold text-white">{cfg.chips}× {hw.name}</span>
          <br />
          {modelLabel(cfg, t)} · {cfg.batch} {t.cost.users} ·{' '}
          <span className="font-mono text-slate-200">{m.fits ? `${num(m.systemTps)} ${tokSec()}` : t.cost.noFit}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label={t.cost.kwh} suffix="$/kWh" step={0.01} accent="text-neon-lime" value={cfg.kwhPrice} onChange={(v) => v && set((x) => ({ ...x, kwhPrice: v }))} />
          <NumField label={t.cost.hours} suffix={t.cost.hoursUnit} accent="text-neon-cyan" value={cfg.hoursPerDay} onChange={(v) => v && set((x) => ({ ...x, hoursPerDay: Math.min(24, v) }))} />
          <NumField label={t.cost.years} suffix={t.cost.yearsUnit} value={cfg.years} onChange={(v) => v && set((x) => ({ ...x, years: Math.min(10, v) }))} />
          <NumField label={t.cost.api} suffix="$/1M" step={0.05} accent="text-neon-pink" value={cfg.apiPricePerM} onChange={(v) => v && set((x) => ({ ...x, apiPricePerM: v }))} />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">{t.cost.assumptions}</p>
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
                <div className="font-mono text-2xl font-bold text-white">
                  {k.monthly === null ? '—' : usd(k.monthly)}
                  <span className="text-xs text-slate-400"> {t.cost.perMonth}</span>
                </div>
                <div className="font-mono text-xs text-slate-300">{k.perM === null ? '—' : `${usdSmart(k.perM)} ${t.cost.perM}`}</div>
                <div className="mt-2 text-[11px] leading-snug text-slate-400">{k.sub}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Award className="h-4 w-4 text-neon-amber" /> {t.cost.winnerIs} <b className="text-white">{t.cost.winners[c.cheapest]}</b>
            </div>
            <Badge tone="violet">{t.cost.breakEven(months(c.breakEvenMonths))}</Badge>
          </div>
          <Timeline cfg={cfg} m={m} completeSystem={completeSystem} />
          <p className="mt-2 text-[11px] text-slate-500">{t.cost.volume(num(c.tokensPerMonthM))}</p>
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
  const { t, lang } = useI18n();
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
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string, lang) : (va as number) - (vb as number);
      return desc ? -cmp : cmp;
    });
  }, [cfg, q, sortKey, desc, category, lang]);

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
        <div className="text-xs text-slate-400">{t.table.summary(modelLabel(cfg, t), cfg.batch, tokens(cfg.context), cfg.chips)}</div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.table.search} className="field w-56 py-2 pl-8 text-xs" />
        </label>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-xs [&_td]:whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-ink-800/95 text-[11px] uppercase tracking-wider text-slate-400 backdrop-blur">
            <tr>
              <Th k="name" right={false}>{t.table.hw}</Th>
              <Th k="vram">{t.table.mem}</Th>
              <Th k="bw">{t.table.bw}</Th>
              <th className="px-3 py-2.5 text-center">{t.table.status}</th>
              <Th k="single">{t.table.one}</Th>
              <Th k="system">{t.table.many(cfg.batch)}</Th>
              <Th k="users">{t.table.max}</Th>
              <Th k="cost">$/1M</Th>
              <Th k="price">{t.table.price}</Th>
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
                    {r.many.fits ? <Badge tone="ok">{pct(r.many.utilPct)}</Badge> : r.one.fits ? <Badge tone="warn">{t.table.upTo(num(r.one.maxBatch))}</Badge> : <Badge tone="bad">OOM</Badge>}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${r.one.fits ? 'text-neon-cyan' : 'text-slate-600'}`}>{r.one.fits ? tps(r.one.perUserTps) : '—'}</td>
                  <td className={`px-3 py-2.5 text-right ${r.many.fits ? 'text-violet-300' : 'text-slate-600'}`}>{r.many.fits ? num(r.many.systemTps) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{num(r.one.maxBatch)}</td>
                  <td className={`px-3 py-2.5 text-right ${r.many.fits ? 'text-amber-300' : 'text-slate-600'}`}>{r.many.fits ? usdSmart(r.many.costPerM) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-pink-300">{r.price === null ? t.table.cloud : usd(r.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
