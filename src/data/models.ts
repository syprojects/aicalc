// Model mimarileri.
// kvElems: token başına KV cache eleman sayısı (tüm katmanlar).
//   GQA:  2 (K+V) × katman × KV başlığı × başlık boyutu
//   MLA (DeepSeek/Kimi): katman × (kv_lora_rank 512 + rope 64)
// Bit derinliğiyle çarpılınca token başına KV byte miktarı bulunur.

export interface ModelPreset {
  id: string;
  name: string;
  totalB: number;
  activeB: number;
  moe: boolean;
  kvElems: number;
}

const gqa = (layers: number, kvHeads: number, headDim: number) => 2 * layers * kvHeads * headDim;
const mla = (layers: number) => layers * (512 + 64);

export const MODELS: ModelPreset[] = [
  { id: 'llama32_1b', name: 'Llama 3.2 1B', totalB: 1.24, activeB: 1.24, moe: false, kvElems: gqa(16, 8, 64) },
  { id: 'qwen25_1_5b', name: 'Qwen 2.5 1.5B', totalB: 1.5, activeB: 1.5, moe: false, kvElems: gqa(28, 2, 128) },
  { id: 'llama32_3b', name: 'Llama 3.2 3B', totalB: 3.2, activeB: 3.2, moe: false, kvElems: gqa(28, 8, 128) },
  { id: 'llama31_8b', name: 'Llama 3.1 8B', totalB: 8, activeB: 8, moe: false, kvElems: gqa(32, 8, 128) },
  { id: 'qwen3_8b', name: 'Qwen3 8B', totalB: 8.2, activeB: 8.2, moe: false, kvElems: gqa(36, 8, 128) },
  { id: 'phi4_14b', name: 'Phi-4 14B', totalB: 14.7, activeB: 14.7, moe: false, kvElems: gqa(40, 10, 128) },
  { id: 'qwen3_32b', name: 'Qwen3 32B', totalB: 32.8, activeB: 32.8, moe: false, kvElems: gqa(64, 8, 128) },
  { id: 'llama33_70b', name: 'Llama 3.3 70B', totalB: 70.6, activeB: 70.6, moe: false, kvElems: gqa(80, 8, 128) },
  { id: 'mistral_large', name: 'Mistral Large 2 123B', totalB: 123, activeB: 123, moe: false, kvElems: gqa(88, 8, 128) },
  { id: 'llama31_405b', name: 'Llama 3.1 405B', totalB: 405, activeB: 405, moe: false, kvElems: gqa(126, 8, 128) },
  { id: 'gpt_oss_20b', name: 'gpt-oss 20B (MoE)', totalB: 21, activeB: 3.6, moe: true, kvElems: gqa(24, 8, 64) },
  { id: 'qwen3_30b_a3b', name: 'Qwen3 30B-A3B (MoE)', totalB: 30.5, activeB: 3.3, moe: true, kvElems: gqa(48, 4, 128) },
  { id: 'mixtral_8x7b', name: 'Mixtral 8x7B (MoE)', totalB: 46.7, activeB: 12.9, moe: true, kvElems: gqa(32, 8, 128) },
  { id: 'llama4_scout', name: 'Llama 4 Scout (MoE)', totalB: 109, activeB: 17, moe: true, kvElems: gqa(48, 8, 128) },
  { id: 'gpt_oss_120b', name: 'gpt-oss 120B (MoE)', totalB: 117, activeB: 5.1, moe: true, kvElems: gqa(36, 8, 64) },
  { id: 'qwen3_235b', name: 'Qwen3 235B-A22B (MoE)', totalB: 235, activeB: 22, moe: true, kvElems: gqa(94, 4, 128) },
  { id: 'llama4_maverick', name: 'Llama 4 Maverick (MoE)', totalB: 400, activeB: 17, moe: true, kvElems: gqa(48, 8, 128) },
  { id: 'deepseek_v3', name: 'DeepSeek V3 / R1 (MoE)', totalB: 671, activeB: 37, moe: true, kvElems: mla(61) },
  { id: 'kimi_k2', name: 'Kimi K2 1T (MoE)', totalB: 1000, activeB: 32, moe: true, kvElems: mla(61) },
];

// Mimarisi bilinmeyen özel modeller için: 70B GQA modelinin oranından ölçeklenen kaba tahmin.
export const estimateKvElems = (totalB: number) => Math.round(2340 * totalB);

export const findModel = (id: string) => MODELS.find((m) => m.id === id);

export const WEIGHT_QUANTS = [
  { bits: 16, label: 'FP16', sub: '16-bit' },
  { bits: 8, label: 'FP8', sub: '8-bit' },
  { bits: 6.5, label: 'Q6_K', sub: '6.5-bit' },
  { bits: 4.5, label: 'Q4_K_M', sub: '4.5-bit' },
  { bits: 4.25, label: 'MXFP4', sub: '4.25-bit' },
  { bits: 3, label: 'Q3', sub: '3-bit' },
] as const;

export const KV_QUANTS = [
  { bits: 16, label: 'FP16' },
  { bits: 8, label: 'FP8' },
  { bits: 4, label: 'INT4' },
] as const;

export const SPEC_OPTIONS = [
  { mult: 1, label: 'Off' },
  { mult: 1.6, label: 'EAGLE / Draft ×1.6' },
  { mult: 2.1, label: 'MTP / Medusa ×2.1' },
] as const;
