// Donanım veritabanı.
// bw: GB/sn, vram: GB (çip başına), tflops: FP8/INT8 yoğun (dense) yaklaşık değer,
// tdp: W, rent: $/saat/çip (bulut kiralama tahmini), price: $ (çip/sistem satın alma tahmini, yoksa null).
// Fiyatlar piyasaya göre hızla değişir; arayüzde her değer düzenlenebilir.

export type Category = 'consumer' | 'workstation' | 'datacenter' | 'tpu' | 'apple' | 'amd';

export interface Hardware {
  id: string;
  name: string;
  short: string;
  category: Category;
  memType: string;
  vram: number;
  bw: number;
  tflops: number;
  tdp: number;
  rent: number;
  price: number | null;
  maxChips: number;
}

export const CATEGORIES: { id: Category | 'all'; color: string }[] = [
  { id: 'all', color: '#e2e8f0' },
  { id: 'consumer', color: '#22d3ee' },
  { id: 'workstation', color: '#2dd4bf' },
  { id: 'apple', color: '#e879f9' },
  { id: 'datacenter', color: '#84cc16' },
  { id: 'amd', color: '#f43f5e' },
  { id: 'tpu', color: '#fbbf24' },
];

export const categoryColor = (c: Category) => CATEGORIES.find((x) => x.id === c)?.color ?? '#94a3b8';

export const HARDWARE: Hardware[] = [
  // GeForce / tüketici
  { id: 'rtx3060_8', name: 'NVIDIA RTX 3060 (8 GB)', short: 'RTX 3060 8G', category: 'consumer', memType: 'GDDR6', vram: 8, bw: 240, tflops: 70, tdp: 170, rent: 0.15, price: 250, maxChips: 4 },
  { id: 'rtx3060_12', name: 'NVIDIA RTX 3060 (12 GB)', short: 'RTX 3060 12G', category: 'consumer', memType: 'GDDR6', vram: 12, bw: 360, tflops: 75, tdp: 170, rent: 0.18, price: 280, maxChips: 4 },
  { id: 'rtx4060ti_16', name: 'NVIDIA RTX 4060 Ti (16 GB)', short: 'RTX 4060 Ti', category: 'consumer', memType: 'GDDR6', vram: 16, bw: 288, tflops: 165, tdp: 165, rent: 0.25, price: 450, maxChips: 4 },
  { id: 'rtx4070tis_16', name: 'NVIDIA RTX 4070 Ti Super (16 GB)', short: 'RTX 4070 Ti S', category: 'consumer', memType: 'GDDR6X', vram: 16, bw: 672, tflops: 330, tdp: 285, rent: 0.35, price: 800, maxChips: 4 },
  { id: 'rtx3090', name: 'NVIDIA RTX 3090 (24 GB)', short: 'RTX 3090', category: 'consumer', memType: 'GDDR6X', vram: 24, bw: 936, tflops: 142, tdp: 350, rent: 0.4, price: 800, maxChips: 4 },
  { id: 'rtx4090', name: 'NVIDIA RTX 4090 (24 GB)', short: 'RTX 4090', category: 'consumer', memType: 'GDDR6X', vram: 24, bw: 1008, tflops: 660, tdp: 450, rent: 0.65, price: 2000, maxChips: 4 },
  { id: 'rtx5070ti', name: 'NVIDIA RTX 5070 Ti (16 GB)', short: 'RTX 5070 Ti', category: 'consumer', memType: 'GDDR7', vram: 16, bw: 896, tflops: 450, tdp: 300, rent: 0.45, price: 800, maxChips: 4 },
  { id: 'rtx5080', name: 'NVIDIA RTX 5080 (16 GB)', short: 'RTX 5080', category: 'consumer', memType: 'GDDR7', vram: 16, bw: 960, tflops: 560, tdp: 360, rent: 0.55, price: 1100, maxChips: 4 },
  { id: 'rtx5090', name: 'NVIDIA RTX 5090 (32 GB)', short: 'RTX 5090', category: 'consumer', memType: 'GDDR7', vram: 32, bw: 1792, tflops: 1050, tdp: 575, rent: 0.95, price: 2500, maxChips: 4 },

  // Masaüstü AI / iş istasyonu
  { id: 'ryzen_ai_max', name: 'AMD Ryzen AI Max+ 395 (128 GB)', short: 'Ryzen AI Max+', category: 'workstation', memType: 'LPDDR5X', vram: 128, bw: 256, tflops: 60, tdp: 120, rent: 0.2, price: 2000, maxChips: 1 },
  { id: 'dgx_spark', name: 'NVIDIA DGX Spark GB10 (128 GB)', short: 'DGX Spark', category: 'workstation', memType: 'LPDDR5X', vram: 128, bw: 273, tflops: 250, tdp: 240, rent: 0.3, price: 4000, maxChips: 2 },
  { id: 'rtx_pro6000', name: 'NVIDIA RTX PRO 6000 Blackwell (96 GB)', short: 'RTX PRO 6000', category: 'workstation', memType: 'GDDR7', vram: 96, bw: 1792, tflops: 2000, tdp: 600, rent: 1.8, price: 8500, maxChips: 8 },

  // Apple Silicon
  { id: 'apple_m1max', name: 'Apple M1 Max (64 GB)', short: 'M1 Max', category: 'apple', memType: 'Unified', vram: 64, bw: 400, tflops: 40, tdp: 60, rent: 0.25, price: 1800, maxChips: 1 },
  { id: 'apple_m3max', name: 'Apple M3 Max (128 GB)', short: 'M3 Max', category: 'apple', memType: 'Unified', vram: 128, bw: 400, tflops: 65, tdp: 78, rent: 0.35, price: 4500, maxChips: 1 },
  { id: 'apple_m4max', name: 'Apple M4 Max (128 GB)', short: 'M4 Max', category: 'apple', memType: 'Unified', vram: 128, bw: 546, tflops: 90, tdp: 90, rent: 0.4, price: 4700, maxChips: 1 },
  { id: 'apple_m2ultra', name: 'Apple M2 Ultra (192 GB)', short: 'M2 Ultra', category: 'apple', memType: 'Unified', vram: 192, bw: 800, tflops: 85, tdp: 120, rent: 0.5, price: 5500, maxChips: 1 },
  { id: 'apple_m3ultra', name: 'Apple M3 Ultra (512 GB)', short: 'M3 Ultra', category: 'apple', memType: 'Unified', vram: 512, bw: 819, tflops: 110, tdp: 200, rent: 0.8, price: 9500, maxChips: 1 },

  // NVIDIA veri merkezi
  { id: 'nvidia_l4', name: 'NVIDIA L4 (24 GB)', short: 'L4', category: 'datacenter', memType: 'GDDR6', vram: 24, bw: 300, tflops: 242, tdp: 72, rent: 0.8, price: 2500, maxChips: 8 },
  { id: 'nvidia_l40s', name: 'NVIDIA L40S (48 GB)', short: 'L40S', category: 'datacenter', memType: 'GDDR6', vram: 48, bw: 864, tflops: 733, tdp: 350, rent: 1.65, price: 8500, maxChips: 8 },
  { id: 'nvidia_a100_40', name: 'NVIDIA A100 (40 GB)', short: 'A100 40G', category: 'datacenter', memType: 'HBM2', vram: 40, bw: 1555, tflops: 624, tdp: 400, rent: 1.8, price: 9000, maxChips: 16 },
  { id: 'nvidia_a100_80', name: 'NVIDIA A100 (80 GB)', short: 'A100 80G', category: 'datacenter', memType: 'HBM2e', vram: 80, bw: 2039, tflops: 624, tdp: 400, rent: 2.2, price: 15000, maxChips: 16 },
  { id: 'nvidia_h100', name: 'NVIDIA H100 SXM (80 GB)', short: 'H100', category: 'datacenter', memType: 'HBM3', vram: 80, bw: 3350, tflops: 1979, tdp: 700, rent: 3.0, price: 27000, maxChips: 16 },
  { id: 'nvidia_h200', name: 'NVIDIA H200 SXM (141 GB)', short: 'H200', category: 'datacenter', memType: 'HBM3e', vram: 141, bw: 4800, tflops: 1979, tdp: 700, rent: 3.8, price: 32000, maxChips: 16 },
  { id: 'nvidia_b200', name: 'NVIDIA B200 Blackwell (192 GB)', short: 'B200', category: 'datacenter', memType: 'HBM3e', vram: 192, bw: 8000, tflops: 4500, tdp: 1000, rent: 5.2, price: 40000, maxChips: 16 },
  { id: 'nvidia_b300', name: 'NVIDIA B300 Blackwell Ultra (288 GB)', short: 'B300', category: 'datacenter', memType: 'HBM3e', vram: 288, bw: 8000, tflops: 6000, tdp: 1200, rent: 6.2, price: 50000, maxChips: 16 },
  { id: 'nvidia_rubin', name: 'NVIDIA Vera Rubin R100 (288 GB)', short: 'Rubin', category: 'datacenter', memType: 'HBM4', vram: 288, bw: 13000, tflops: 8000, tdp: 1400, rent: 7.5, price: 60000, maxChips: 16 },

  // AMD
  { id: 'amd_7900xtx', name: 'AMD Radeon RX 7900 XTX (24 GB)', short: 'RX 7900 XTX', category: 'amd', memType: 'GDDR6', vram: 24, bw: 960, tflops: 245, tdp: 355, rent: 0.45, price: 900, maxChips: 4 },
  { id: 'amd_mi300x', name: 'AMD Instinct MI300X (192 GB)', short: 'MI300X', category: 'amd', memType: 'HBM3', vram: 192, bw: 5300, tflops: 2614, tdp: 750, rent: 3.4, price: 15000, maxChips: 16 },
  { id: 'amd_mi325x', name: 'AMD Instinct MI325X (256 GB)', short: 'MI325X', category: 'amd', memType: 'HBM3e', vram: 256, bw: 6000, tflops: 2614, tdp: 1000, rent: 3.9, price: 20000, maxChips: 16 },
  { id: 'amd_mi355x', name: 'AMD Instinct MI355X (288 GB)', short: 'MI355X', category: 'amd', memType: 'HBM3e', vram: 288, bw: 8000, tflops: 5000, tdp: 1400, rent: 4.5, price: 25000, maxChips: 16 },

  // Google Cloud TPU (yalnızca kiralanabilir)
  { id: 'tpu_v5e', name: 'Google TPU v5e (16 GB)', short: 'TPU v5e', category: 'tpu', memType: 'HBM2e', vram: 16, bw: 819, tflops: 393, tdp: 200, rent: 1.2, price: null, maxChips: 16 },
  { id: 'tpu_v5p', name: 'Google TPU v5p (95 GB)', short: 'TPU v5p', category: 'tpu', memType: 'HBM2e', vram: 95, bw: 2765, tflops: 918, tdp: 450, rent: 2.8, price: null, maxChips: 16 },
  { id: 'tpu_v6e', name: 'Google TPU v6e Trillium (32 GB)', short: 'TPU v6e', category: 'tpu', memType: 'HBM', vram: 32, bw: 1640, tflops: 1836, tdp: 300, rent: 1.8, price: null, maxChips: 16 },
  { id: 'tpu_ironwood', name: 'Google Ironwood TPU v7 (192 GB)', short: 'Ironwood', category: 'tpu', memType: 'HBM3e', vram: 192, bw: 7400, tflops: 4614, tdp: 600, rent: 3.5, price: null, maxChips: 16 },
  { id: 'tpu_8i', name: 'Google TPU 8i Inference (288 GB)', short: 'TPU 8i', category: 'tpu', memType: 'HBM', vram: 288, bw: 9600, tflops: 5000, tdp: 650, rent: 4.1, price: null, maxChips: 16 },
];

export const CHIP_OPTIONS = [1, 2, 4, 8, 16] as const;

export const findHardware = (id: string) => HARDWARE.find((h) => h.id === id);
