// Dil seçimine göre sayı biçimi ve birimler. setFormatLang, I18nProvider tarafından çağrılır.

export type Lang = 'tr' | 'en';

const UNITS = {
  tr: { perSec: 'sn', sec: 'sn', ms: 'ms', days: 'gün', months: 'ay', years: 'yıl', never: 'Hiçbir zaman' },
  en: { perSec: 's', sec: 's', ms: 'ms', days: 'days', months: 'mo', years: 'yr', never: 'Never' },
};

let lang: Lang = 'tr';
let u = UNITS.tr;
const cache = new Map<string, Intl.NumberFormat>();

export function setFormatLang(l: Lang) {
  lang = l;
  u = UNITS[l];
}

const nf = (digits: number) => {
  const key = `${lang}-${digits}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    cache.set(key, f);
  }
  return f;
};

export const unit = () => u;

export const num = (v: number, digits = 0) => (!Number.isFinite(v) ? '—' : nf(digits).format(v));

export const gb = (v: number) => (v >= 1000 ? `${num(v / 1000, 2)} TB` : v >= 100 ? `${num(v, 0)} GB` : `${num(v, 1)} GB`);

export const bw = (gbs: number) => (gbs >= 1000 ? `${num(gbs / 1000, 2)} TB/${u.perSec}` : `${num(gbs, 0)} GB/${u.perSec}`);

export const usd = (v: number | null, digits = 0) => (v === null || !Number.isFinite(v) ? '—' : `$${num(v, digits)}`);

export const usdSmart = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : v < 1 ? usd(v, 3) : v < 100 ? usd(v, 2) : usd(v, 0));

export const tps = (v: number) => (v >= 100 ? num(v, 0) : num(v, 1));

export const tokSec = () => `tok/${u.perSec}`;

export const ms = (v: number) => (v >= 1000 ? `${num(v / 1000, 2)} ${u.sec}` : `${num(v, v < 10 ? 1 : 0)} ms`);

export const tokens = (v: number) => (v >= 1024 && v % 1024 === 0 ? `${v / 1024}K` : num(v));

export const months = (v: number | null) => {
  if (v === null || !Number.isFinite(v)) return u.never;
  if (v < 1) return `${num(v * 30, 0)} ${u.days}`;
  if (v < 24) return `${num(v, 1)} ${u.months}`;
  return `${num(v / 12, 1)} ${u.years}`;
};

export const pct = (v: number) => (lang === 'tr' ? `%${num(v)}` : `${num(v)}%`);
