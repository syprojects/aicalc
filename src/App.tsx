import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { CATEGORIES, type Category } from './data/hardware';
import { SCENARIOS, fromQuery, toQuery, withHardware, type Config } from './lib/config';
import { compute, type Metrics } from './lib/engine';
import { useI18n } from './lib/i18n';
import { HardwarePanel, ModelPanel, WorkloadPanel, type SetCfg } from './components/Controls';
import { KpiGrid, MemoryBreakdown, MobileSummary, SpeedPreview, StatusBanner } from './components/Results';
import { Advisor, CompareTable, CostSection } from './components/Sections';
import { Guide } from './components/Guide';
import { Footer, Header, Hero, ShareModal } from './components/Layout';
import { Card, Pills, SectionHeading } from './components/ui';

// Grafik kütüphanesi ayrı bir parçada yüklenir; ilk açılış hızlı kalır.
const AnalysisCharts = lazy(() => import('./components/charts/Charts').then((m) => ({ default: m.AnalysisCharts })));
const HardwareRace = lazy(() => import('./components/charts/Charts').then((m) => ({ default: m.HardwareRace })));
const CostTimelineLazy = lazy(() => import('./components/charts/Charts').then((m) => ({ default: m.CostTimeline })));

function ChartFallback({ h = 320 }: { h?: number }) {
  return <div className="w-full animate-pulse rounded-xl bg-white/[0.03]" style={{ height: h }} />;
}

function CostTimeline(props: { cfg: Config; m: Metrics; completeSystem: boolean }) {
  return (
    <Suspense fallback={<ChartFallback h={300} />}>
      <CostTimelineLazy {...props} />
    </Suspense>
  );
}

export default function App() {
  const { t, lang } = useI18n();
  const [cfg, setCfg] = useState<Config>(() => fromQuery(window.location.search));
  const set: SetCfg = useCallback((fn) => setCfg((c) => fn(c)), []);
  const [shareOpen, setShareOpen] = useState(false);
  const [cat, setCat] = useState<Category | 'all'>('all');

  // Kaydırıcılar akıcı kalsın diye ağır bölümler (grafik, tablo, danışman) ertelenmiş değeri kullanır.
  const m = useMemo(() => compute(cfg.hw, cfg.chips, cfg), [cfg]);
  const dcfg = useDeferredValue(cfg);
  const dm = useMemo(() => compute(dcfg.hw, dcfg.chips, dcfg), [dcfg]);

  const query = toQuery(cfg);
  const activeScenario = useMemo(() => SCENARIOS.find((s) => toQuery(s.apply(cfg)) === query)?.id ?? null, [cfg, query]);

  useEffect(() => {
    const timer = setTimeout(() => window.history.replaceState(null, '', `?${query}&lang=${lang}${window.location.hash}`), 250);
    return () => clearTimeout(timer);
  }, [query, lang]);

  const selectHw = useCallback(
    (id: string) => {
      set((c) => withHardware(c, id));
      document.getElementById('hesapla-s')?.scrollIntoView({ behavior: 'smooth' });
    },
    [set],
  );
  const goCalc = useCallback(() => document.getElementById('hesapla-s')?.scrollIntoView({ behavior: 'smooth' }), []);

  return (
    <>
      <div aria-hidden className="aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] h-[60vh] w-[60vw] animate-aurora rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -right-[10%] top-[10%] h-[55vh] w-[50vw] animate-aurora rounded-full bg-violet-600/20 blur-[120px] [animation-delay:-7s]" />
        <div className="absolute bottom-[-20%] left-[30%] h-[50vh] w-[45vw] animate-aurora rounded-full bg-pink-500/10 blur-[120px] [animation-delay:-14s]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(148,163,184,.08)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </div>

      <Header onShare={() => setShareOpen(true)} />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <Hero set={set} activeScenario={activeScenario} />

        <section className="pt-8">
          <SectionHeading id="hesapla-s" kicker={t.sec.calc.kicker} title={t.sec.calc.title} />
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:sticky lg:top-20 lg:col-span-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
              <HardwarePanel cfg={cfg} set={set} />
              <ModelPanel cfg={cfg} set={set} />
              <WorkloadPanel cfg={cfg} set={set} />
            </div>
            <div className="space-y-5 lg:col-span-8">
              <StatusBanner m={m} cfg={cfg} />
              <KpiGrid m={m} cfg={cfg} />
              <SpeedPreview m={m} />
              <MemoryBreakdown m={m} cfg={cfg} />
              <Card className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <BarChart3 className="h-4 w-4 text-neon-pink" /> {t.sec.calc.charts}
                </h3>
                <Suspense fallback={<ChartFallback />}>
                  <AnalysisCharts cfg={dcfg} m={dm} />
                </Suspense>
              </Card>
            </div>
          </div>
        </section>

        <section className="pt-20">
          <SectionHeading
            id="danisman-s"
            kicker={t.sec.advisor.kicker}
            title={<>{t.sec.advisor.t1}<span className="text-gradient">{t.sec.advisor.hi}</span>{t.sec.advisor.t2}</>}
            desc={t.sec.advisor.desc}
          />
          <Advisor cfg={dcfg} set={set} onApplied={goCalc} />
        </section>

        <section className="pt-20">
          <SectionHeading
            id="maliyet-s"
            kicker={t.sec.cost.kicker}
            title={t.sec.cost.title}
            desc={t.sec.cost.desc}
          />
          <CostSection cfg={dcfg} set={set} m={dm} Timeline={CostTimeline} />
        </section>

        <section className="pt-20">
          <SectionHeading
            id="karsilastir-s"
            kicker={t.sec.compare.kicker}
            title={t.sec.compare.title}
            desc={t.sec.compare.desc}
          />
          <div className="mb-4">
            <Pills options={CATEGORIES.map((c) => ({ value: c.id, label: t.cat[c.id] }))} value={cat} onChange={setCat} />
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card className="p-5 xl:col-span-5">
              <Suspense fallback={<ChartFallback h={600} />}>
                <HardwareRace cfg={dcfg} onSelect={selectHw} category={cat} />
              </Suspense>
            </Card>
            <div className="xl:col-span-7">
              <CompareTable cfg={dcfg} onSelect={selectHw} category={cat} />
            </div>
          </div>
        </section>

        <section className="pt-20">
          <SectionHeading id="rehber-s" kicker={t.sec.guide.kicker} title={t.sec.guide.title} desc={t.sec.guide.desc} />
          <Guide />
        </section>
      </main>

      <Footer />
      <MobileSummary m={m} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} cfg={cfg} m={m} />
    </>
  );
}
