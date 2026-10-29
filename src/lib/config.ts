import { findHardware } from '../data/hardware';
import { estimateKvElems, findModel } from '../data/models';
import type { CostInputs, HwSpec, Workload } from './engine';

export interface Config extends Workload, CostInputs {
  hwId: string;
  hw: HwSpec;
  customHw: boolean;
  chips: number;
  modelId: string;
}

export const specOf = (id: string): HwSpec => {
  const h = findHardware(id)!;
  return { vram: h.vram, bw: h.bw, tflops: h.tflops, tdp: h.tdp, rent: h.rent, price: h.price };
};

export function withModel(cfg: Config, modelId: string): Config {
  const m = findModel(modelId);
  if (!m) return { ...cfg, modelId: 'custom' };
  return { ...cfg, modelId, totalB: m.totalB, activeB: m.activeB, moe: m.moe, kvElems: m.kvElems };
}

export function withHardware(cfg: Config, hwId: string): Config {
  const h = findHardware(hwId);
  if (!h) return cfg;
  return { ...cfg, hwId, hw: specOf(hwId), customHw: false, chips: Math.min(cfg.chips, h.maxChips) };
}

const BASE: Config = {
  hwId: 'nvidia_h200',
  hw: specOf('nvidia_h200'),
  customHw: false,
  chips: 1,
  modelId: 'llama33_70b',
  totalB: 70.6,
  activeB: 70.6,
  moe: false,
  kvElems: 163840,
  weightBits: 8,
  kvBits: 8,
  batch: 8,
  context: 8192,
  prompt: 1500,
  spec: 1,
  kwhPrice: 0.15,
  hoursPerDay: 24,
  years: 3,
  apiPricePerM: 0.9,
};

export const DEFAULT_CONFIG = BASE;

export interface Scenario {
  id: string;
  emoji: string;
  apply: (c: Config) => Config;
}

const scenario = (hwId: string, chips: number, modelId: string, over: Partial<Config>) => (c: Config) => ({
  ...withModel(withHardware(c, hwId), modelId),
  chips,
  ...over,
});

export const SCENARIOS: Scenario[] = [
  { id: 'home', emoji: '🏠', apply: scenario('rtx3060_12', 1, 'llama31_8b', { weightBits: 4.5, batch: 1, context: 8192, prompt: 500 }) },
  { id: 'gamer', emoji: '🎮', apply: scenario('rtx5090', 1, 'qwen3_32b', { weightBits: 4.5, batch: 1, context: 16384, prompt: 1000 }) },
  { id: 'mac', emoji: '🍎', apply: scenario('apple_m3ultra', 1, 'deepseek_v3', { weightBits: 4.5, batch: 1, context: 16384, prompt: 1000 }) },
  { id: 'office', emoji: '🏢', apply: scenario('nvidia_l40s', 2, 'llama33_70b', { weightBits: 8, batch: 16, context: 8192, prompt: 1500 }) },
  { id: 'saas', emoji: '🚀', apply: scenario('nvidia_h200', 8, 'deepseek_v3', { weightBits: 8, batch: 64, context: 16384, prompt: 2000 }) },
  { id: 'tpu', emoji: '🔥', apply: scenario('tpu_ironwood', 1, 'llama33_70b', { weightBits: 8, batch: 1, context: 4096, prompt: 1000 }) },
];

// ---------------------------------------------------------------------------
// URL (#hash) ile paylaşılabilir durum
// ---------------------------------------------------------------------------

const NUM_KEYS: [keyof Config, string][] = [
  ['chips', 'c'],
  ['totalB', 'tb'],
  ['activeB', 'ab'],
  ['kvElems', 'kve'],
  ['weightBits', 'wb'],
  ['kvBits', 'kb'],
  ['batch', 'b'],
  ['context', 'ctx'],
  ['prompt', 'p'],
  ['spec', 's'],
  ['kwhPrice', 'kwh'],
  ['hoursPerDay', 'hpd'],
  ['years', 'y'],
  ['apiPricePerM', 'api'],
];

const HW_KEYS: [keyof HwSpec, string][] = [
  ['vram', 'v'],
  ['bw', 'bw'],
  ['tflops', 'tf'],
  ['tdp', 'w'],
  ['rent', 'r'],
  ['price', 'pr'],
];

export function toQuery(c: Config): string {
  const p = new URLSearchParams();
  p.set('hw', c.hwId);
  p.set('m', c.modelId);
  if (c.moe) p.set('moe', '1');
  for (const [k, short] of NUM_KEYS) p.set(short, String(c[k]));
  if (c.customHw) for (const [k, short] of HW_KEYS) p.set(short, String(c.hw[k] ?? ''));
  return p.toString();
}

export function fromQuery(query: string): Config {
  const p = new URLSearchParams(query);
  let c: Config = { ...BASE };
  const hwId = p.get('hw');
  if (hwId && findHardware(hwId)) c = withHardware(c, hwId);
  const modelId = p.get('m');
  if (modelId) c = modelId === 'custom' ? { ...c, modelId } : withModel(c, modelId);
  if (p.has('moe') || modelId === 'custom') c.moe = p.get('moe') === '1';
  for (const [k, short] of NUM_KEYS) {
    const v = Number(p.get(short));
    if (p.has(short) && Number.isFinite(v) && v > 0) (c as unknown as Record<string, number>)[k] = v;
  }
  if (p.has('v')) {
    const hw = { ...c.hw };
    for (const [k, short] of HW_KEYS) {
      const raw = p.get(short);
      const v = Number(raw);
      if (k === 'price' && (raw === '' || raw === 'null')) hw.price = null;
      else if (raw !== null && Number.isFinite(v) && v > 0) (hw as Record<string, number | null>)[k] = v;
    }
    c = { ...c, hw, customHw: true };
  }
  if (c.modelId === 'custom' && !p.has('kve')) c.kvElems = estimateKvElems(c.totalB);
  return c;
}
