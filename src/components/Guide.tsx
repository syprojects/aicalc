import { BookOpen, ChevronDown, Compass, Lightbulb, Wrench } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { Card } from './ui';

export function Guide() {
  const { t } = useI18n();
  const g = t.guide;
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Compass className="h-4 w-4 text-neon-cyan" /> {g.roadmapTitle}
          </h3>
          <ol className="space-y-3">
            {g.roadmap.map(([title, desc], i) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 font-mono text-xs font-bold text-on-accent">{i + 1}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs leading-relaxed text-slate-400">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Lightbulb className="h-4 w-4 text-neon-amber" /> {g.rulesTitle}
            </h3>
            <dl className="space-y-2.5">
              {g.rules.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-3 text-xs">
                  <dt className="font-semibold text-neon-amber">{k}</dt>
                  <dd className="font-mono text-slate-300">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Wrench className="h-4 w-4 text-neon-lime" /> {g.stackTitle}
            </h3>
            <ul className="space-y-2.5">
              {g.stack.map(([who, tools, why]) => (
                <li key={who} className="text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-semibold text-white">{who}</span>
                    <span className="font-mono text-neon-lime">{tools}</span>
                  </div>
                  <div className="text-slate-400">{why}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <BookOpen className="h-4 w-4 text-neon-violet" /> {g.glossaryTitle}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {g.glossary.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/5 bg-ink-900/50 p-3 transition hover:border-neon-violet/40">
              <div className="mb-1 font-mono text-xs font-bold text-neon-violet">{k}</div>
              <div className="text-xs leading-relaxed text-slate-400">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        {g.faq.map(([q, a]) => (
          <details key={q} className="glass group rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
