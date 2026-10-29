// LLM çıkarım fizik motoru (Roofline modeli).
// Tüm fonksiyonlar saf (pure) — arayüzden bağımsız test edilebilir.

import { CHIP_OPTIONS, HARDWARE, type Hardware } from '../data/hardware';

export interface HwSpec {
  vram: number;
  bw: number;
  tflops: number;
  tdp: number;
  rent: number;
  price: number | null;
}

export interface Workload {
  totalB: number;
  activeB: number;
  moe: boolean;
  kvElems: number;
  weightBits: number;
  kvBits: number;
  batch: number;
  context: number;
  prompt: number;
  spec: number;
}

export interface Metrics {
  totalVramGb: number;
  effBwGbs: number;
  effTflops: number;
  weightsGb: number;
  activeReadGb: number;
  kvPerTokenKb: number;
  kvPerUserGb: number;
  kvTotalGb: number;
  overheadGb: number;
  requiredGb: number;
  utilPct: number;
  fits: boolean;
  weightsFit: boolean;
  maxBatch: number;
  bytesPerStepGb: number;
  memTimeMs: number;
  computeTimeMs: number;
  computeBound: boolean;
  arithIntensity: number;
  perUserTps: number;
  systemTps: number;
  itlMs: number;
  ttftMs: number;
  answer500Sec: number;
  bwUsedTbs: number;
  hourlyCost: number;
  costPerM: number;
  watts: number;
  tokPerWatt: number;
  kwhPerM: number;
}

const MFU_DECODE = 0.65;
const MFU_PREFILL = 0.5;
const PER_USER_ACT_GB = 0.03;
const MAX_BATCH_CAP = 4096;

export const scalingEfficiency = (chips: number) => (chips === 1 ? 1 : chips <= 4 ? 0.92 : 0.86);

const baseOverheadGb = (weightsGb: number, chips: number) => 0.8 + 0.5 * (chips - 1) + weightsGb * 0.04;

// MoE modellerde batch büyüdükçe farklı token'lar farklı uzmanlara gider ve
// her adımda okunan benzersiz ağırlık miktarı aktif parametreden toplam parametreye doğru yaklaşır.
export function moeUniqueReadGb(weightsGb: number, activeFrac: number, tokens: number) {
  if (activeFrac >= 1) return weightsGb;
  const touched = 1 - Math.pow(1 - activeFrac, Math.max(1, tokens));
  return weightsGb * Math.max(activeFrac, touched);
}

export function compute(hw: HwSpec, chips: number, w: Workload): Metrics {
  const eff = scalingEfficiency(chips);
  const totalVramGb = hw.vram * chips;
  const effBwGbs = hw.bw * chips * eff;
  const effTflops = hw.tflops * chips * eff;
  const batch = Math.max(1, Math.round(w.batch));
  const activeB = w.moe ? Math.min(w.activeB, w.totalB) : w.totalB;
  const activeFrac = activeB / w.totalB;

  const weightsGb = (w.totalB * w.weightBits) / 8;
  const activeReadGb = (activeB * w.weightBits) / 8;

  const kvBytesPerToken = w.kvElems * (w.kvBits / 8);
  const kvPerUserGb = (kvBytesPerToken * w.context) / 1e9;
  const kvTotalGb = kvPerUserGb * batch;

  const base = baseOverheadGb(weightsGb, chips);
  const overheadGb = base + batch * PER_USER_ACT_GB;
  const requiredGb = weightsGb + kvTotalGb + overheadGb;
  const fits = requiredGb <= totalVramGb;
  const weightsFit = weightsGb + base <= totalVramGb;
  const freeForKv = totalVramGb - weightsGb - base;
  const maxBatch = freeForKv > 0 ? Math.min(MAX_BATCH_CAP, Math.floor(freeForKv / (kvPerUserGb + PER_USER_ACT_GB))) : 0;

  // Decode adımı: ağırlıklar bir kez + tüm kullanıcıların KV cache'i okunur.
  const weightReadGb = w.moe ? moeUniqueReadGb(weightsGb, activeFrac, batch) : weightsGb;
  const bytesPerStepGb = weightReadGb + kvTotalGb;
  const memTimeS = bytesPerStepGb / effBwGbs;
  const flopsPerStep = 2 * activeB * 1e9 * batch;
  const computeTimeS = flopsPerStep / (effTflops * 1e12 * MFU_DECODE);
  const stepS = Math.max(memTimeS, computeTimeS) * 1.03;

  // Spekülatif kod çözme kazancı batch büyüdükçe azalır (boş hesaplama kapasitesi kalmaz).
  const specEff = 1 + (w.spec - 1) * Math.max(0.15, 1 - batch / 48);
  const perUserTps = (1 / stepS) * specEff;
  const systemTps = perUserTps * batch;

  // Prefill (ilk token gecikmesi): istem tek seferde işlenir, genellikle hesaplama sınırlıdır.
  const prompt = Math.max(1, w.prompt);
  const prefillCompute = (2 * activeB * 1e9 * prompt) / (effTflops * 1e12 * MFU_PREFILL);
  const prefillRead = (w.moe ? moeUniqueReadGb(weightsGb, activeFrac, prompt) : weightsGb) / effBwGbs;
  const ttftS = Math.max(prefillCompute, prefillRead) + stepS;

  const hourlyCost = hw.rent * chips;
  const tokensPerHour = systemTps * 3600;
  const watts = hw.tdp * chips;

  return {
    totalVramGb,
    effBwGbs,
    effTflops,
    weightsGb,
    activeReadGb,
    kvPerTokenKb: kvBytesPerToken / 1024,
    kvPerUserGb,
    kvTotalGb,
    overheadGb,
    requiredGb,
    utilPct: (requiredGb / totalVramGb) * 100,
    fits,
    weightsFit,
    maxBatch,
    bytesPerStepGb,
    memTimeMs: memTimeS * 1000,
    computeTimeMs: computeTimeS * 1000,
    computeBound: computeTimeS > memTimeS,
    arithIntensity: flopsPerStep / (bytesPerStepGb * 1e9),
    perUserTps,
    systemTps,
    itlMs: 1000 / perUserTps,
    ttftMs: ttftS * 1000,
    answer500Sec: ttftS + 500 / perUserTps,
    bwUsedTbs: bytesPerStepGb / stepS / 1000,
    hourlyCost,
    costPerM: hourlyCost / (tokensPerHour / 1e6),
    watts,
    tokPerWatt: systemTps / watts,
    kwhPerM: (watts / 1000) / (tokensPerHour / 1e6),
  };
}

// ---------------------------------------------------------------------------
// Satın alma / kiralama (TCO) analizi
// ---------------------------------------------------------------------------

export interface CostInputs {
  kwhPrice: number;
  hoursPerDay: number;
  years: number;
  apiPricePerM: number;
}

export interface CostResult {
  capex: number | null;
  rentMonthly: number;
  powerMonthly: number;
  ownedMonthly: number | null;
  tokensPerMonthM: number;
  rentPerM: number;
  ownedPerM: number | null;
  apiMonthly: number;
  breakEvenMonths: number | null;
  cheapest: 'rent' | 'buy' | 'api';
}

const PUE = 1.25; // soğutma + sistemin geri kalanı
const PLATFORM_FACTOR = 1.2; // anakart, CPU, kasa, ağ vb. (komple sistemlerde 1.0)

export function costAnalysis(hw: HwSpec, chips: number, m: Metrics, c: CostInputs, completeSystem: boolean): CostResult {
  const hoursMonth = c.hoursPerDay * 30;
  const rentMonthly = hw.rent * chips * hoursMonth;
  const powerMonthly = ((hw.tdp * chips * PUE) / 1000) * hoursMonth * c.kwhPrice;
  const capex = hw.price === null ? null : hw.price * chips * (completeSystem ? 1 : PLATFORM_FACTOR);
  const ownedMonthly = capex === null ? null : capex / (c.years * 12) + powerMonthly;
  const tokensPerMonthM = (m.fits ? m.systemTps : 0) * 3600 * hoursMonth / 1e6;
  const perM = (cost: number) => (tokensPerMonthM > 0 ? cost / tokensPerMonthM : Infinity);
  const saving = rentMonthly - powerMonthly;
  const breakEvenMonths = capex !== null && saving > 0 ? capex / saving : null;
  const apiMonthly = tokensPerMonthM * c.apiPricePerM;

  const options: [CostResult['cheapest'], number][] = [
    ['rent', rentMonthly],
    ['api', apiMonthly],
  ];
  if (ownedMonthly !== null) options.push(['buy', ownedMonthly]);
  options.sort((a, b) => a[1] - b[1]);

  return {
    capex,
    rentMonthly,
    powerMonthly,
    ownedMonthly,
    tokensPerMonthM,
    rentPerM: perM(rentMonthly),
    ownedPerM: ownedMonthly === null ? null : perM(ownedMonthly),
    apiMonthly,
    breakEvenMonths,
    cheapest: options[0][0],
  };
}

// ---------------------------------------------------------------------------
// Donanım danışmanı: hedefi karşılayan en küçük kurulumları bulur
// ---------------------------------------------------------------------------

export interface Recommendation {
  hw: Hardware;
  chips: number;
  m: Metrics;
  monthlyRent: number;
  capex: number | null;
}

export type RecSort = 'rent' | 'buy' | 'speed' | 'efficiency';

export function recommend(w: Workload, users: number, minTps: number, sort: RecSort, hoursPerDay = 24): Recommendation[] {
  const out: Recommendation[] = [];
  for (const hw of HARDWARE) {
    for (const chips of CHIP_OPTIONS) {
      if (chips > hw.maxChips) break;
      const m = compute(hw, chips, { ...w, batch: users });
      if (m.fits && m.perUserTps >= minTps) {
        const completeSystem = hw.category === 'apple' || hw.category === 'workstation';
        out.push({
          hw,
          chips,
          m,
          monthlyRent: hw.rent * chips * hoursPerDay * 30,
          capex: hw.price === null ? null : hw.price * chips * (completeSystem ? 1 : PLATFORM_FACTOR),
        });
        break;
      }
    }
  }
  const sorters: Record<RecSort, (a: Recommendation, b: Recommendation) => number> = {
    rent: (a, b) => a.monthlyRent - b.monthlyRent,
    buy: (a, b) => (a.capex ?? Infinity) - (b.capex ?? Infinity),
    speed: (a, b) => b.m.perUserTps - a.m.perUserTps,
    efficiency: (a, b) => b.m.tokPerWatt - a.m.tokPerWatt,
  };
  return out.sort(sorters[sort]);
}

// İnsan okuma hızına göre akıcılık yorumu (Türkçe ortalama ≈ 4-6 token/sn okuma).
export function speedVerdict(tps: number): { label: string; tone: 'bad' | 'warn' | 'ok' | 'great' } {
  if (tps < 5) return { label: 'Yavaş — okuma hızının altında', tone: 'bad' };
  if (tps < 15) return { label: 'Okunabilir — sohbet için yeterli', tone: 'warn' };
  if (tps < 50) return { label: 'Akıcı — ChatGPT benzeri deneyim', tone: 'ok' };
  return { label: 'Çok hızlı — ajan / kod üretimi için ideal', tone: 'great' };
}
