import { describe, expect, it } from 'vitest';
import { compute, costAnalysis, moeUniqueReadGb, recommend, type Workload } from './engine';
import { findHardware } from '../data/hardware';
import { findModel } from '../data/models';

const workloadFor = (modelId: string, over: Partial<Workload> = {}): Workload => {
  const m = findModel(modelId)!;
  return {
    totalB: m.totalB,
    activeB: m.activeB,
    moe: m.moe,
    kvElems: m.kvElems,
    weightBits: 8,
    kvBits: 8,
    batch: 1,
    context: 4096,
    prompt: 1000,
    spec: 1,
    ...over,
  };
};

describe('compute', () => {
  it('70B FP8 tek Ironwood TPU üzerinde ~100 tok/sn verir (bant genişliği / ağırlık)', () => {
    const m = compute(findHardware('tpu_ironwood')!, 1, workloadFor('llama33_70b'));
    expect(m.fits).toBe(true);
    expect(m.computeBound).toBe(false);
    expect(m.perUserTps).toBeGreaterThan(95);
    expect(m.perUserTps).toBeLessThan(106);
  });

  it('70B FP8 tek RTX 3060 12 GB belleğe sığmaz', () => {
    const m = compute(findHardware('rtx3060_12')!, 1, workloadFor('llama33_70b'));
    expect(m.fits).toBe(false);
    expect(m.weightsFit).toBe(false);
    expect(m.maxBatch).toBe(0);
  });

  it('Llama 3 70B için KV cache FP8 ile token başına 160 KB', () => {
    const m = compute(findHardware('nvidia_h200')!, 1, workloadFor('llama33_70b'));
    expect(m.kvPerTokenKb).toBeCloseTo(160, 0);
  });

  it('batch arttıkça toplam üretim artar, kullanıcı başı hız azalır', () => {
    const hw = findHardware('nvidia_h200')!;
    const a = compute(hw, 1, workloadFor('llama33_70b', { batch: 1 }));
    const b = compute(hw, 1, workloadFor('llama33_70b', { batch: 32 }));
    expect(b.systemTps).toBeGreaterThan(a.systemTps * 10);
    expect(b.perUserTps).toBeLessThan(a.perUserTps);
  });

  it('maxBatch sınırında model sığar, bir fazlasında sığmaz', () => {
    const hw = findHardware('nvidia_h100')!;
    const base = compute(hw, 1, workloadFor('llama31_8b'));
    expect(compute(hw, 1, workloadFor('llama31_8b', { batch: base.maxBatch })).fits).toBe(true);
    expect(compute(hw, 1, workloadFor('llama31_8b', { batch: base.maxBatch + 1 })).fits).toBe(false);
  });

  it('daha fazla çip daha fazla bellek ve hız sağlar', () => {
    const hw = findHardware('nvidia_l40s')!;
    const one = compute(hw, 1, workloadFor('llama33_70b'));
    const two = compute(hw, 2, workloadFor('llama33_70b'));
    expect(one.fits).toBe(false);
    expect(two.fits).toBe(true);
    expect(two.effBwGbs).toBeGreaterThan(one.effBwGbs);
  });
});

describe('MoE', () => {
  it('batch=1 iken yalnızca aktif ağırlık okunur, büyük batch toplam ağırlığa yaklaşır', () => {
    expect(moeUniqueReadGb(671, 37 / 671, 1)).toBeCloseTo(37, 5);
    expect(moeUniqueReadGb(671, 37 / 671, 512)).toBeGreaterThan(660);
  });

  it('DeepSeek V3 bellekte toplam, hızda aktif parametreyi baz alır', () => {
    const m = compute(findHardware('tpu_8i')!, 4, workloadFor('deepseek_v3'));
    expect(m.weightsGb).toBeCloseTo(671, 0);
    expect(m.activeReadGb).toBeCloseTo(37, 0);
    expect(m.fits).toBe(true);
  });
});

describe('recommend', () => {
  it('yalnızca hedefi karşılayan kurulumları önerir ve kiraya göre sıralar', () => {
    const recs = recommend(workloadFor('llama33_70b'), 8, 20, 'rent');
    expect(recs.length).toBeGreaterThan(3);
    for (const r of recs) {
      expect(r.m.fits).toBe(true);
      expect(r.m.perUserTps).toBeGreaterThanOrEqual(20);
    }
    for (let i = 1; i < recs.length; i++) expect(recs[i].monthlyRent).toBeGreaterThanOrEqual(recs[i - 1].monthlyRent);
  });
});

describe('costAnalysis', () => {
  it('TPU satın alınamaz, kira başabaş noktası yoktur', () => {
    const hw = findHardware('tpu_v6e')!;
    const m = compute(hw, 1, workloadFor('llama31_8b'));
    const c = costAnalysis(hw, 1, m, { kwhPrice: 0.15, hoursPerDay: 24, years: 3, apiPricePerM: 0.2 }, false);
    expect(c.capex).toBeNull();
    expect(c.breakEvenMonths).toBeNull();
  });

  it('satın alınan GPU zamanla kiralamadan ucuza gelir', () => {
    const hw = findHardware('rtx4090')!;
    const m = compute(hw, 1, workloadFor('llama31_8b'));
    const c = costAnalysis(hw, 1, m, { kwhPrice: 0.15, hoursPerDay: 24, years: 3, apiPricePerM: 0.2 }, false);
    expect(c.breakEvenMonths).not.toBeNull();
    expect(c.breakEvenMonths!).toBeGreaterThan(1);
    expect(c.ownedMonthly!).toBeLessThan(c.rentMonthly);
  });
});
