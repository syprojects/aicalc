const tr = (digits: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const nf0 = tr(0);
const nf1 = tr(1);
const nf2 = tr(2);

export const num = (v: number, digits = 0) => (!Number.isFinite(v) ? '—' : digits === 0 ? nf0.format(v) : digits === 1 ? nf1.format(v) : digits === 2 ? nf2.format(v) : tr(digits).format(v));

export const gb = (v: number) => (v >= 1000 ? `${num(v / 1000, 2)} TB` : v >= 100 ? `${num(v, 0)} GB` : `${num(v, 1)} GB`);

export const bw = (gbs: number) => (gbs >= 1000 ? `${num(gbs / 1000, 2)} TB/sn` : `${num(gbs, 0)} GB/sn`);

export const usd = (v: number | null, digits = 0) => (v === null || !Number.isFinite(v) ? '—' : `$${num(v, digits)}`);

export const usdSmart = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : v < 1 ? usd(v, 3) : v < 100 ? usd(v, 2) : usd(v, 0));

export const tps = (v: number) => (v >= 100 ? num(v, 0) : num(v, 1));

export const ms = (v: number) => (v >= 1000 ? `${num(v / 1000, 2)} sn` : `${num(v, v < 10 ? 1 : 0)} ms`);

export const tokens = (v: number) => (v >= 1024 && v % 1024 === 0 ? `${v / 1024}K` : num(v));

export const months = (v: number | null) => {
  if (v === null || !Number.isFinite(v)) return 'Hiçbir zaman';
  if (v < 1) return `${num(v * 30, 0)} gün`;
  if (v < 24) return `${num(v, 1)} ay`;
  return `${num(v / 12, 1)} yıl`;
};
