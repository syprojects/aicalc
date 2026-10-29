// Google Analytics 4 olay gönderimi. gtag, index.html'de yüklenir; yoksa (yerel geliştirme,
// reklam engelleyici) sessizce hiçbir şey yapmaz.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Record<string, string | number> = {}) {
  try {
    window.gtag?.('event', event, params);
  } catch {
    /* analiz hatası uygulamayı etkilemesin */
  }
}
