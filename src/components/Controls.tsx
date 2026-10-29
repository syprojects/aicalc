import { useMemo, useState } from 'react';
import { Brain, Cpu, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, CHIP_OPTIONS, HARDWARE, findHardware, type Category } from '../data/hardware';
import { KV_QUANTS, MODELS, SPEC_OPTIONS, WEIGHT_QUANTS, estimateKvElems, findModel } from '../data/models';
import { withHardware, withModel, type Config } from '../lib/config';
import { bw, num, tokens } from '../lib/format';
import { Badge, Card, Hint, NumField, PanelHeader, Pills, Slider } from './ui';

export type SetCfg = (fn: (c: Config) => Config) => void;

export function HardwarePanel({ cfg, set }: { cfg: Config; set: SetCfg }) {
  const current = findHardware(cfg.hwId)!;
  const [cat, setCat] = useState<Category | 'all'>('all');
  const list = useMemo(() => HARDWARE.filter((h) => cat === 'all' || h.category === cat), [cat]);
  const editHw = (patch: Partial<Config['hw']>) => set((c) => ({ ...c, hw: { ...c.hw, ...patch }, customHw: true }));

  return (
    <Card className="p-5">
      <PanelHeader
        icon={<Cpu className="h-4 w-4" />}
        title="1 · Donanım"
        badge={cfg.customHw ? <Badge tone="violet">Özel ayar</Badge> : <Badge tone="info">{current.memType}</Badge>}
      />
      <div className="space-y-4">
        <Pills
          options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          value={cat}
          onChange={(v) => {
            setCat(v);
            const first = HARDWARE.find((h) => v === 'all' || h.category === v);
            if (first && v !== 'all' && current.category !== v) set((c) => withHardware(c, first.id));
          }}
        />
        <div>
          <label htmlFor="hw" className="label mb-1.5 block">
            Çip / ekran kartı
          </label>
          <select id="hw" className="field font-medium" value={cfg.hwId} onChange={(e) => set((c) => withHardware(c, e.target.value))}>
            {!list.some((h) => h.id === cfg.hwId) && <option value={cfg.hwId}>{current.name}</option>}
            {list.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} — {bw(h.bw)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label flex items-center gap-1.5">
              Çip adedi <Hint text="Birden fazla çip, modeli parçalara bölerek (Tensor Parallelism) bellek ve bant genişliğini toplar. Çipler arası iletişim yüzünden verim %86-92'ye düşer." />
            </span>
            <span className="font-mono text-xs font-bold text-neon-cyan">{cfg.chips}× çip</span>
          </div>
          <Pills
            cols="grid-cols-5"
            options={CHIP_OPTIONS.map((n) => ({ value: n, label: `${n}×`, title: n > current.maxChips ? 'Bu donanımda pratik değil' : undefined }))}
            value={cfg.chips}
            onChange={(v) => set((c) => ({ ...c, chips: v }))}
            isDisabled={(v) => v > current.maxChips}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
          <NumField label="Bellek / çip" suffix="GB" value={cfg.hw.vram} onChange={(v) => v && editHw({ vram: v })} />
          <NumField label="Bant genişliği" suffix="GB/sn" accent="text-neon-cyan" step={10} value={cfg.hw.bw} onChange={(v) => v && editHw({ bw: v })} />
          <NumField label="FP8 gücü" suffix="TFLOPS" accent="text-neon-lime" step={10} value={cfg.hw.tflops} onChange={(v) => v && editHw({ tflops: v })} />
          <NumField label="Güç (TDP)" suffix="W" value={cfg.hw.tdp} onChange={(v) => v && editHw({ tdp: v })} />
          <NumField label="Kira / saat" suffix="$" accent="text-neon-amber" step={0.05} value={cfg.hw.rent} onChange={(v) => v && editHw({ rent: v })} />
          <NumField label="Satın alma" suffix="$" accent="text-neon-pink" step={100} allowEmpty value={cfg.hw.price} onChange={(v) => editHw({ price: v })} />
        </div>
        {cfg.customHw && (
          <button type="button" onClick={() => set((c) => withHardware(c, c.hwId))} className="pill flex w-full items-center justify-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Varsayılan değerlere dön
          </button>
        )}
      </div>
    </Card>
  );
}

export function ModelPanel({ cfg, set }: { cfg: Config; set: SetCfg }) {
  const preset = findModel(cfg.modelId);
  const setCustom = (patch: Partial<Config>) =>
    set((c) => {
      const next = { ...c, ...patch, modelId: 'custom' };
      if (!next.moe) next.activeB = next.totalB;
      next.activeB = Math.min(next.activeB, next.totalB);
      next.kvElems = estimateKvElems(next.totalB);
      return next;
    });

  return (
    <Card className="p-5">
      <PanelHeader
        icon={<Brain className="h-4 w-4" />}
        title="2 · Model"
        accent="text-neon-violet"
        badge={cfg.moe ? <Badge tone="violet">MoE</Badge> : <Badge tone="ok">Dense</Badge>}
      />
      <div className="space-y-4">
        <div>
          <label htmlFor="model" className="label mb-1.5 block">
            Hazır model
          </label>
          <select id="model" className="field font-medium" value={cfg.modelId} onChange={(e) => set((c) => withModel(c, e.target.value))}>
            <optgroup label="Dense (yoğun) modeller">
              {MODELS.filter((m) => !m.moe).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.note}
                </option>
              ))}
            </optgroup>
            <optgroup label="MoE (uzman karışımı) modeller">
              {MODELS.filter((m) => m.moe).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {num(m.totalB)}B / {num(m.activeB, 1)}B aktif
                </option>
              ))}
            </optgroup>
            <option value="custom">Özel model (kaydırıcı ile)</option>
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="label">Toplam parametre</span>
            <span className="font-mono font-bold text-neon-violet">{num(cfg.totalB, cfg.totalB < 10 ? 1 : 0)} Milyar</span>
          </div>
          <Slider ariaLabel="Toplam parametre" log min={0.5} max={1100} value={cfg.totalB} round={(v) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v))} onChange={(v) => setCustom({ totalB: v })} />
        </div>

        <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              MoE (Mixture of Experts)
              <Hint text="MoE modellerde tüm parametreler bellekte durur ama her token için yalnızca küçük bir 'uzman' grubu çalışır. Bu yüzden bellek ihtiyacı büyük, hız ise aktif parametreye göredir." />
            </span>
            <input
              type="checkbox"
              checked={cfg.moe}
              onChange={(e) => setCustom({ moe: e.target.checked, activeB: e.target.checked ? Math.max(1, Math.round(cfg.totalB * 0.1)) : cfg.totalB })}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
          {cfg.moe && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Token başına aktif</span>
                <span className="font-mono font-bold text-neon-pink">{num(cfg.activeB, 1)}B</span>
              </div>
              <Slider ariaLabel="Aktif parametre" log min={0.5} max={Math.max(1, cfg.totalB)} value={cfg.activeB} round={(v) => Math.round(v * 10) / 10} onChange={(v) => setCustom({ activeB: v })} />
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label flex items-center gap-1.5">
              Ağırlık hassasiyeti <Hint text="Kuantizasyon: ağırlıkları daha az bit ile saklamak. 16→4 bit modelin boyutunu 4 kat küçültür ve hızı neredeyse 4 kat artırır; kalite kaybı Q4'te genellikle küçüktür." />
            </span>
            <span className="font-mono text-xs font-bold text-neon-cyan">{cfg.weightBits}-bit</span>
          </div>
          <Pills
            cols="grid-cols-3"
            options={WEIGHT_QUANTS.map((q) => ({
              value: q.bits,
              label: (
                <span className="flex flex-col leading-tight">
                  <span className="font-mono">{q.label}</span>
                  <span className="text-[10px] opacity-70">{q.sub}</span>
                </span>
              ),
            }))}
            value={cfg.weightBits}
            onChange={(v) => set((c) => ({ ...c, weightBits: v }))}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          KV cache: <span className="font-mono text-slate-300">{num((cfg.kvElems * cfg.kvBits) / 8 / 1024, 0)} KB/token</span>
          {preset ? ' (mimariden hesaplandı)' : ' (tahmini)'}
        </p>
      </div>
    </Card>
  );
}

const BATCH_QUICK = [1, 4, 16, 64, 256];
const CTX_QUICK = [2048, 8192, 32768, 131072];

export function WorkloadPanel({ cfg, set }: { cfg: Config; set: SetCfg }) {
  return (
    <Card className="p-5">
      <PanelHeader icon={<SlidersHorizontal className="h-4 w-4" />} title="3 · Kullanım" accent="text-neon-amber" />
      <div className="space-y-5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label flex items-center gap-1.5">
              Eşzamanlı kullanıcı <Hint text="Batch size: aynı anda yanıt üretilen istek sayısı. Ağırlıklar bir kez okunup herkese kullanıldığı için toplam üretim katlanarak artar; ama her kullanıcının KV cache'i ayrıca bellek harcar." />
            </span>
            <span className="font-mono text-xs font-bold text-neon-amber">{cfg.batch} kişi</span>
          </div>
          <Slider ariaLabel="Eşzamanlı kullanıcı" log min={1} max={512} value={cfg.batch} onChange={(v) => set((c) => ({ ...c, batch: v }))} />
          <div className="mt-1 flex justify-between">
            {BATCH_QUICK.map((b) => (
              <button key={b} type="button" onClick={() => set((c) => ({ ...c, batch: b }))} className="font-mono text-[10px] text-slate-500 hover:text-neon-amber">
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label flex items-center gap-1.5">
              Bağlam uzunluğu <Hint text="Context: modelin bir sohbette hatırladığı toplam token (istem + geçmiş + yanıt). Uzun bağlam = kullanıcı başına daha büyük KV cache." />
            </span>
            <span className="font-mono text-xs font-bold text-neon-cyan">{tokens(cfg.context)} token</span>
          </div>
          <Slider
            ariaLabel="Bağlam uzunluğu"
            log
            min={512}
            max={131072}
            value={cfg.context}
            round={(v) => Math.max(512, Math.round(v / 512) * 512)}
            onChange={(v) => set((c) => ({ ...c, context: v, prompt: Math.min(c.prompt, v) }))}
          />
          <div className="mt-1 flex justify-between">
            {CTX_QUICK.map((b) => (
              <button key={b} type="button" onClick={() => set((c) => ({ ...c, context: b, prompt: Math.min(c.prompt, b) }))} className="font-mono text-[10px] text-slate-500 hover:text-neon-cyan">
                {tokens(b)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label flex items-center gap-1.5">
              İstem (prompt) uzunluğu <Hint text="Soruyla birlikte gönderilen metin (belge, kod, geçmiş). Uzun istem ilk token gelene kadar geçen süreyi (TTFT) artırır." />
            </span>
            <span className="font-mono text-xs font-bold text-neon-pink">{num(cfg.prompt)} token</span>
          </div>
          <Slider ariaLabel="İstem uzunluğu" log min={16} max={cfg.context} value={cfg.prompt} round={(v) => (v < 100 ? Math.round(v) : Math.round(v / 50) * 50)} onChange={(v) => set((c) => ({ ...c, prompt: v }))} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <span className="label mb-1.5 flex items-center gap-1.5">
              KV cache <Hint text="Sohbet geçmişinin bellekte tutulma hassasiyeti. FP8 kaliteyi korurken belleği yarıya indirir." />
            </span>
            <Pills cols="grid-cols-3" options={KV_QUANTS.map((q) => ({ value: q.bits, label: q.label }))} value={cfg.kvBits} onChange={(v) => set((c) => ({ ...c, kvBits: v }))} />
          </div>
          <div>
            <span className="label mb-1.5 flex items-center gap-1.5">
              Spekülatif çözme <Hint text="Küçük bir taslak model birkaç token'ı önceden tahmin eder, büyük model tek adımda doğrular. Düşük batch'te 1.5-2× hız kazandırır." />
            </span>
            <Pills
              cols="grid-cols-3"
              options={SPEC_OPTIONS.map((s) => ({ value: s.mult, label: s.mult === 1 ? 'Kapalı' : `×${s.mult}`, title: s.label }))}
              value={cfg.spec}
              onChange={(v) => set((c) => ({ ...c, spec: v }))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
