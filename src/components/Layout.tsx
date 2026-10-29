import { useEffect, useState } from 'react';
import { Check, Copy, Cpu, GitBranch, Link2, Share2, X } from 'lucide-react';
import { findHardware } from '../data/hardware';
import { findModel } from '../data/models';
import { SCENARIOS, type Config } from '../lib/config';
import type { Metrics } from '../lib/engine';
import { bw, gb, ms, num, tps, usdSmart } from '../lib/format';
import type { SetCfg } from './Controls';

const NAV = [
  ['hesapla', 'Hesapla'],
  ['danisman', 'Danışman'],
  ['maliyet', 'Maliyet'],
  ['karsilastir', 'Karşılaştır'],
  ['rehber', 'Rehber'],
] as const;

export function Header({ onShare }: { onShare: () => void }) {
  const [active, setActive] = useState('hesapla');
  useEffect(() => {
    // Başlıkları değil, başlığın ait olduğu bölümün tamamını izle.
    const sections = new Map<Element, string>();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(sections.get(e.target) ?? 'hesapla')),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    NAV.forEach(([id]) => {
      const el = document.getElementById(`${id}-s`)?.closest('section');
      if (el) {
        sections.set(el, id);
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 shadow-lg shadow-violet-500/30">
            <Cpu className="h-5 w-5 text-ink-950" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-white">AI Donanım Hesaplayıcı</span>
            <span className="block font-mono text-[10px] text-slate-500">aicalc.sysarticles.com</span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Bölümler">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}-s`} className={`rounded-lg px-3 py-1.5 text-sm transition ${active === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </a>
          ))}
        </nav>
        <button type="button" onClick={onShare} className="pill pill-active flex items-center gap-1.5 px-3 py-2">
          <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Paylaş</span>
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Bölümler">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}-s`} className={`shrink-0 rounded-lg px-3 py-1 text-xs ${active === id ? 'bg-white/10 text-white' : 'text-slate-400'}`}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function Hero({ set, activeScenario }: { set: SetCfg; activeScenario: string | null }) {
  return (
    <section id="top" className="relative pb-6 pt-10 sm:pt-14">
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> 35+ donanım · 19 model · canlı hesaplama
        </div>
        <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Yapay zeka modelin <span className="text-gradient">hangi donanıma sığar</span>, ne kadar hızlı çalışır?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Model, ekran kartı ve kullanıcı sayısını seç; bellek ihtiyacını, token hızını, kaç kişiye hizmet verebileceğini ve satın alma ile kiralama maliyetini anında gör.
        </p>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => set(s.apply)}
            className={`glass group rounded-xl p-3 text-left transition hover:-translate-y-0.5 hover:border-neon-violet/40 ${activeScenario === s.id ? 'glow-border' : ''}`}
          >
            <div className="mb-1 text-xl transition group-hover:scale-110">{s.emoji}</div>
            <div className="text-xs font-semibold text-white">{s.title}</div>
            <div className="text-[11px] leading-snug text-slate-400">{s.desc}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function buildReport(cfg: Config, m: Metrics, url: string) {
  const hw = findHardware(cfg.hwId);
  const model = findModel(cfg.modelId)?.name ?? `Özel ${num(cfg.totalB)}B`;
  return `📊 LLM Çıkarım Analizi — ${model}

🖥️ Donanım: ${cfg.chips}× ${hw?.name ?? 'Özel'} (${gb(m.totalVramGb)} bellek · ${bw(m.effBwGbs)})
🧠 Model: ${model} ${cfg.moe ? `(MoE, ${num(cfg.activeB, 1)}B aktif)` : '(Dense)'} @ ${cfg.weightBits}-bit
👥 Yük: ${cfg.batch} eşzamanlı kullanıcı · ${num(cfg.context)} token bağlam

${m.fits ? '✅ Belleğe sığıyor' : '❌ Bellek yetersiz (OOM)'} — ${gb(m.requiredGb)} / ${gb(m.totalVramGb)} (max ${num(m.maxBatch)} kullanıcı)
⚡ Kullanıcı başı: ${tps(m.perUserTps)} tok/sn · ilk token ${ms(m.ttftMs)}
🚀 Toplam üretim: ${num(m.systemTps)} tok/sn
💵 Bulut maliyeti: ${usdSmart(m.costPerM)} / 1M token

🔗 Kendi senaryonu hesapla: ${url}
#LLM #GPU #AIInfrastructure #SysArticles`;
}

export function ShareModal({ open, onClose, cfg, m }: { open: boolean; onClose: () => void; cfg: Config; m: Metrics }) {
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const url = window.location.href;
  const text = buildReport(cfg, m, url);
  const copy = async (what: 'link' | 'text') => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? url : text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* pano erişimi reddedildi */
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Paylaş">
      <div className="glass glow-border w-full max-w-xl animate-pop rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <Share2 className="h-4 w-4 text-neon-cyan" /> Senaryoyu paylaş
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          <input readOnly value={url} className="field font-mono text-xs" onFocus={(e) => e.target.select()} />
          <button type="button" onClick={() => copy('link')} className="pill pill-active flex shrink-0 items-center gap-1.5 px-3">
            {copied === 'link' ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Bağlantı
          </button>
        </div>
        <textarea readOnly value={text} rows={13} className="field resize-none font-mono text-[11px] leading-relaxed" />
        <button type="button" onClick={() => copy('text')} className="pill mt-3 flex w-full items-center justify-center gap-1.5 py-2.5">
          {copied === 'text' ? <><Check className="h-4 w-4 text-emerald-400" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> LinkedIn / rapor metnini kopyala</>}
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 pb-20 pt-8 lg:pb-8">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} <a href="https://sysarticles.com" className="text-slate-300 hover:text-white">SysArticles</a> · Değerler teorik üst sınırdır; fiyatlar tahminidir. MIT lisanslı.
        </p>
        <div className="flex items-center gap-4">
          <a href="./v2/" className="hover:text-white">Eski sürüm (v2)</a>
          <a href="https://github.com/syprojects/aicalc" className="flex items-center gap-1 hover:text-white">
            <GitBranch className="h-3.5 w-3.5" /> Kaynak kod
          </a>
        </div>
      </div>
    </footer>
  );
}
