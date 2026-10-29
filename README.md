# 🧠 AI Donanım & LLM Çıkarım Hesaplayıcı

[![Canlı](https://img.shields.io/badge/Canl%C4%B1-aicalc.sysarticles.com-a855f7?style=for-the-badge)](https://aicalc.sysarticles.com)
[![Deploy](https://img.shields.io/github/actions/workflow/status/syprojects/aicalc/deploy.yml?style=for-the-badge&label=Yay%C4%B1n)](https://github.com/syprojects/aicalc/actions)
[![Stack](https://img.shields.io/badge/React_%7C_Vite_%7C_Tailwind_%7C_ECharts-22d3ee?style=for-the-badge)](#teknoloji)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-f59e0b?style=for-the-badge)](LICENSE)

**Modelim hangi donanıma sığar, ne kadar hızlı çalışır, kaç kişiye hizmet verir, ne kadara mal olur?** sorularını canlı grafiklerle yanıtlayan, LLM çıkarımına yeni başlayanlar ve altyapı mühendisleri için Türkçe hesaplayıcı.

## ✨ Neler var?

| Bölüm | Ne yapar? |
|---|---|
| **Hesaplayıcı** | 35+ donanım (RTX 3060 → Vera Rubin, Apple M-serisi, AMD Instinct, Google TPU) × 19 model (Llama, Qwen3, DeepSeek, gpt-oss, Kimi K2…). Bellek sığma durumu, kullanıcı başı hız, toplam üretim, ilk token süresi (TTFT), $/1M token. |
| **Canlı hız önizlemesi** | Hesaplanan token/sn hızında akan örnek metin ve hız göstergesi — sayıların gerçekte nasıl hissettirdiğini gösterir. |
| **Analiz grafikleri** | Kullanıcı ölçekleme (OOM bölgesiyle), bağlam → kapasite, Roofline (bellek mi işlem gücü mü sınırlıyor). |
| **Donanım danışmanı** | "8 kişi, kişi başı 20 tok/sn" gibi bir hedef ver; hedefi karşılayan en küçük kurulumları kira / satın alma / hız / enerji verimine göre sıralar. |
| **Maliyet** | Bulutta kirala vs satın al (+elektrik, amortisman) vs hazır API; kümülatif maliyet grafiği ve başabaş süresi. |
| **Karşılaştırma** | Seçili model tüm donanımlarda: yarış grafiği + sıralanabilir tablo. |
| **Rehber** | 6 adımlık yol haritası, pratik kurallar, sözlük, hangi yazılım (Ollama, MLX, vLLM, TensorRT-LLM…), SSS. |
| **Paylaşım** | Tüm ayarlar URL'de saklanır; bağlantı ve LinkedIn rapor metni tek tıkla kopyalanır. |

## 📐 Hesap modeli (özet)

- **Ağırlık belleği** = toplam parametre × bit ÷ 8
- **KV cache / token** = 2 × katman × KV başlığı × başlık boyutu × KV bit ÷ 8 (DeepSeek/Kimi için MLA: katman × 576). Hazır modellerde gerçek mimariden hesaplanır.
- **Decode adımı** = max(okunan veri ÷ bant genişliği, 2 × aktif parametre × batch ÷ (TFLOPS × %65))
- **MoE**: batch büyüdükçe farklı uzmanlar devreye girer; okunan ağırlık aktiften toplama doğru `1 − (1 − aktif/toplam)^batch` oranında büyür.
- **TTFT** = istem uzunluğu × 2 × aktif parametre ÷ (TFLOPS × %50)
- Çoklu çipte iletişim kaybı: 2-4 çip %92, 8-16 çip %86 verim.

Değerler teorik üst sınırdır; gerçek dünyada yazılım ve çekirdek optimizasyonuna bağlı olarak %50-85'i elde edilir. Fiyatlar tahminidir ve arayüzden düzenlenebilir.

## 🛠️ Teknoloji

React 19 · TypeScript · Vite · Tailwind CSS 4 · ECharts (tree-shaken, gecikmeli yüklenir) · Vitest. İlk açılış ~100 KB (gzip); grafik kütüphanesi ihtiyaç anında ayrı parça olarak gelir. Yazı tipleri yerel olarak sunulur, üçüncü taraf istek yoktur.

```
src/
  data/hardware.ts   ← donanım veritabanı (fiyat, bant genişliği…)
  data/models.ts     ← model mimarileri
  lib/engine.ts      ← saf hesap motoru (+ engine.test.ts)
  lib/config.ts      ← durum, senaryolar, URL paylaşımı
  components/        ← arayüz bileşenleri ve grafikler
public/v2/           ← eski tek dosyalık sürüm (/v2/ adresinde)
```

## 🚀 Geliştirme ve yayın

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build   # dist/
```

`main` dalına her push GitHub Actions ile test edilir, derlenir ve GitHub Pages'e yayınlanır. Adım adım kurulum (DNS, özel alan adı, HTTPS, CloudPanel alternatifi) için **[DEPLOY.md](DEPLOY.md)**.

## 🌐 SysArticles

[sysarticles.com](https://sysarticles.com) bünyesinde geliştirilmiştir. MIT lisanslıdır; kaynak göstererek dilediğiniz gibi kullanabilirsiniz.
