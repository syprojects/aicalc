# 🧠 SysArticles AI Donanım & LLM Çıkarım (Inference) Hesaplayıcı

[![Canlı Demo](https://img.shields.io/badge/Canl%C4%B1_Uygulama-aicalc.sysarticles.com-38bdf8?style=for-the-badge&logo=googlechrome&logoColor=white)](https://aicalc.sysarticles.com)
[![SysArticles Blog](https://img.shields.io/badge/Blog-sysarticles.com-0ea5e9?style=for-the-badge&logo=rss&logoColor=white)](https://sysarticles.com)
[![Teknoloji](https://img.shields.io/badge/Stack-HTML5_%7C_TailwindCSS_%7C_Chart.js-10b981?style=for-the-badge)](https://aicalc.sysarticles.com)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-f59e0b?style=for-the-badge)](LICENSE)

**aicalc.sysarticles.com**, büyük dil modellerinin (LLM) çıkarım (inference) aşamasındaki **bellek bant genişliği darboğazını (memory-bandwidth bottleneck)**, **Continuous Batching** ekonomisini, **KV Cache** bellek tüketimini ve **MoE (Mixture of Experts)** mimarilerinin donanım üzerindeki davranışını simüle eden interaktif bir mühendislik aracıdır.

Ev tipi ekran kartlarından (**NVIDIA RTX 3060 8GB/12GB, RTX 4090, RTX 5090**) **Apple Silicon (M1–M4 Ultra)** sistemlere, kurumsal veri merkezi GPU'larından (**L40S, A100, H100, H200, B200, B300, Vera Rubin**) **Google Cloud TPU (v5e, v6e, Ironwood v7, TPU 8i)** ve **AMD Instinct (MI300X, MI325X)** serisine kadar 30'dan fazla donanımı tek ekranda kıyaslamanızı sağlar.

---

## 📸 Ekran Görüntüleri ve Önizleme

> 💡 *Not: GitHub deponuzda `/screenshots` klasörü oluşturup uygulamanın ekran görüntülerini aşağıdaki dosya adlarıyla yüklediğinizde görseller otomatik olarak görüntülenecektir.*

| Ana Hesaplayıcı & KPI Kartları | Batching (1-128) & Donanım Kıyaslama Grafiği |
| :---: | :---: |
| ![Ana Ekran Önizlemesi](screenshots/dashboard-preview.png) | ![Grafik ve Kıyaslama Önizlemesi](screenshots/charts-benchmark.png) |
| *Canlı Roofline Denklemi ve VRAM/KV Cache Dağılımı* | *Çoklu Donanım ve Continuous Batching Ölçeklemesi* |

---

## 🎯 Temel Motivasyon: Yapay Zeka Çipi Seçimi Neden Bir "Bellek" Seçimidir?

Büyük dil modelleri metin üretirken (**Autoregressive Decode** aşaması) kelimeleri/heceleri (token) tek seferde değil, ardışık olarak üretir. 

> **Kritik Mühendislik Gerçeği:** Çip üzerindeki ultra hızlı SRAM önbellekler yalnızca 50 MB ile 200 MB arasındadır. 70 milyar parametreli (70B) 8-bitlik bir model ise bellekte yaklaşık **70 GB** yer kaplar. SRAM'e sığmadığı için, üretilen **her bir yeni token'da** o 70 GB'lık ağırlığın tamamı HBM/GDDR bellekten işlemci çekirdeklerine baştan sona tekrar okunmak zorundadır.

* **Örnek Hesap (70B Model @ FP8):**
  * Model Ağırlığı: $\approx 70\text{ GB}$
  * Hedef Hız: $100\text{ token/saniye}$
  * Gereken Bellek Bant Genişliği: $70\text{ GB} \times 100\text{ token/sn} = 7.000\text{ GB/sn } (7.0\text{ TB/sn})$
  * **Sonuç:** Google'ın **Ironwood TPU** çipi ($7.4\text{ TB/sn}$ bant genişliği) veya NVIDIA **B200** ($8.0\text{ TB/sn}$) üzerinde hiçbir yazılımsal hile olmadan tek bir kullanıcı oturumunda ulaşabileceğiniz fiziksel tavan hız $\approx 105\text{ token/sn}$ civarıdır.

---

## 📊 Örnek Referans Tablosu (Llama-3.3 70B @ FP8 - 8-bit)

Aşağıdaki tablo, **70 GB** ağırlığındaki bir modelin tekil çip (`1x`) kurulumunda farklı donanımlarda verdiği teorik tavan değerleri özetlemektedir:

| Donanım Modeli | Toplam Bellek | Bant Genişliği | Bellek Durumu | Tekil Hız (`Batch=1`) | Max Kullanıcı (`4K Context`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **NVIDIA RTX 3060 (12 GB)** | 12 GB GDDR6 | $360\text{ GB/sn}$ | ❌ OOM (Sığmaz) | — | 0 |
| **NVIDIA RTX 5090 (32 GB)** | 32 GB GDDR7 | $1.79\text{ TB/sn}$ | ❌ OOM (Sığmaz)* | — | 0 |
| **NVIDIA L40S (48 GB)** | 48 GB GDDR6 | $864\text{ GB/sn}$ | ❌ OOM (2x Gerekir) | — | 0 |
| **Apple M4 Max (128 GB)** | 128 GB Unified | $546\text{ GB/sn}$ | ✅ Sığıyor | $\sim 7.5\text{ tok/sn}$ | $\sim 74\text{ Kullanıcı}$ |
| **NVIDIA H100 SXM (80 GB)** | 80 GB HBM3 | $3.35\text{ TB/sn}$ | ✅ Sığıyor (Sınırda) | $\sim 46.2\text{ tok/sn}$ | $\sim 9\text{ Kullanıcı}$ |
| **NVIDIA H200 SXM (141 GB)** | 141 GB HBM3e | $4.80\text{ TB/sn}$ | ✅ Sığıyor | $\sim 66.2\text{ tok/sn}$ | $\sim 92\text{ Kullanıcı}$ |
| **Google Ironwood TPU v7** | 192 GB HBM3e | $7.40\text{ TB/sn}$ | ✅ Sığıyor | $\sim 102.1\text{ tok/sn}$ | $\sim 160+\text{ Kullanıcı}$ |
| **Google TPU 8i Inference** | 288 GB HBM | $9.60\text{ TB/sn}$ | ✅ Sığıyor | $\sim 132.4\text{ tok/sn}$ | $\sim 290+\text{ Kullanıcı}$ |
| **NVIDIA Vera Rubin R100** | 288 GB HBM4 | $13.00\text{ TB/sn}$ | ✅ Sığıyor | $\sim 179.3\text{ tok/sn}$ | $\sim 290+\text{ Kullanıcı}$ |

*(\*Not: RTX 5090 veya L40S üzerinde 70B modeli tek kartta çalıştırmak için modelin 4-bit'e düşürülmesi veya `2x Çip` Tensor Parallelism seçilmesi gerekir).*

---

## ✨ Uygulama Özellikleri

* **🖥️ Geniş Donanım Veritabanı (30+ Çip & Sistem):**
  * **GeForce Tüketici:** RTX 3060 (8 GB & 12 GB), RTX 4060 Ti 16GB, RTX 4070 Ti Super, RTX 3090, RTX 4090, RTX 5070 Ti, RTX 5080, RTX 5090.
  * **NVIDIA Veri Merkezi:** L4, L40, L40S, A100 (40/80 GB), H100, H200, Blackwell B200, B300 Ultra (288 GB), Vera Rubin R100 (288 GB HBM4).
  * **Google Cloud TPU:** TPU v5e, TPU v5p, TPU v6e (Trillium), Ironwood TPU v7 (192 GB), TPU 8i Inference (288 GB).
  * **Apple Silicon (Unified Memory):** M1 Max, M2 Ultra, M3 Max, M4 Max, M4 Ultra.
  * **AMD:** Radeon RX 7900 XTX, Instinct MI300X (192 GB), Instinct MI325X (256 GB).
* **🔗 Çoklu Çip (Tensor Parallelism / Multi-GPU) Desteği:** `1x`, `2x`, `4x`, `8x` ve `16x` çip ölçeklemesi (NVLink / ICI iletişim kayıpları hesaba katılarak).
* **🧩 Dense ve MoE (Mixture of Experts) Model Desteği:**
  * Llama-3.3 70B, Qwen-2.5, Mistral Large 123B, Llama 405B gibi yoğun (Dense) modeller.
  * **DeepSeek-V3 / R1 (671B Toplam / 37B Aktif)** ve **Mixtral 8x7B** gibi MoE modellerde VRAM kapasitesini toplam parametreye göre, token üretim hızını ise aktif parametreye göre hesaplama.
* **🎛️ Kuantizasyon ve Optimizasyon Kontrolleri:**
  * Ağırlık Kuantizasyonu: `FP16 (16-bit)`, `FP8 / INT8 (8-bit)`, `GGUF Q6_K (6-bit)`, `GGUF Q4_K_M (4.5-bit)`, `INT4 / AWQ (4-bit)`.
  * KV Cache Kuantizasyonu (`FP16`, `FP8`, `INT4`) ve **Speculative Decoding** (`EAGLE`, `Medusa / MTP`) çarpanları.
* **📤 Tek Tıkla LinkedIn / Teknik Rapor Çıktısı:** Mevcut simülasyon sonuçlarını doğrudan sosyal medyada veya teknik dokümanlarda paylaşmaya uygun metin formatında kopyalar.

---

## 📐 Arkadaki Matematik ve Roofline Modeli

Uygulama içerisindeki hesaplama motoru, LLM çıkarım fiziğini yöneten **Roofline Modeli** denklemlerini kullanır:

### 1. Model Ağırlıklarının Bellekte Kapladığı Alan ($M_{\text{weights}}$)
Tüm model parametreleri ($P_{\text{total}}$, milyar cinsinden) seçilen bit derinliğine ($B_{\text{weight}}$) göre VRAM/HBM içinde tutulmalıdır:

$$M_{\text{weights}}\text{ (GB)} = \frac{P_{\text{total}} \times B_{\text{weight}}}{8}$$

### 2. Token Başına Okunan Aktif Ağırlık ($M_{\text{active}}$)
Dense modellerde $P_{\text{active}} = P_{\text{total}}$ iken, MoE modellerde (örneğin DeepSeek-R1'de 671B içinden yalnızca 37B) her adımda sadece aktif uzmanlar okunur:

$$M_{\text{active}}\text{ (GB)} = \frac{P_{\text{active}} \times B_{\text{weight}}}{8}$$

### 3. KV Cache (Key-Value Önbelleği) ve 288 GB Bellek Savaşları
Servis sağlayıcılar bellekten 70 GB ağırlığı bir kez okurken bunu tek bir kullanıcı yerine $N$ eşzamanlı kullanıcının ($N = \text{Batch Size}$) isteğiyle çarparak maliyeti düşürür. Ancak her kullanıcının geçmiş konuşma bağlamı ($C = \text{Context Length}$) bellekte **KV Cache** olarak tutulur:

$$M_{\text{KV\_total}}\text{ (GB)} = N \times C \times \alpha_{\text{GQA}} \times P_{\text{active}} \times \left(\frac{B_{\text{KV}}}{8}\right)$$

*(Burada $\alpha_{\text{GQA}}$, modern Grouped-Query Attention mimarilerinin parametre başına bellek katsayısıdır).*

### 4. Adım Süresi ($t_{\text{step}}$) ve Saniyedeki Token Hızı (TPS)
Her üretim adımında hem aktif ağırlıklar hem de o anki tüm kullanıcıların KV Cache verisi bellekten okunur. İşlem süresi, **Bellek Okuma Süresi ($t_{\text{mem}}$)** ile **Aritmetik İşlem Süresinden ($t_{\text{compute}}$)** hangisi daha yavaşsa onun tarafından sınırlandırılır:

$$t_{\text{mem}} = \frac{M_{\text{active}} + M_{\text{KV\_total}}}{\text{BW}_{\text{effective}}}, \quad t_{\text{compute}} = \frac{2 \times P_{\text{active}} \times N}{\text{TFLOPS}_{\text{effective}} \times \text{MFU}}$$

$$t_{\text{step}} = \max\left(t_{\text{mem}}, t_{\text{compute}}\right)$$

$$\text{Kullanıcı Başı Hız (Token/sn)} = \frac{1}{t_{\text{step}}} \times k_{\text{spec}}, \quad \text{Toplam Sistem Üretimi} = \text{Kullanıcı Başı Hız} \times N$$

---

## ❓ Sıkça Sorulan Sorular (SSS)

<details>
<summary><strong>1. Apple Mac Studio (Unified Memory) neden 192 GB belleğe sahip olmasına rağmen sunucu GPU'larından daha yavaş token üretir?</strong></summary>
<br>
Apple M2/M4 Ultra gibi işlemciler yüksek bellek kapasitesi sayesinde devasa modelleri (70B, 123B, hatta 405B Q4) belleğe sığdırabilir. Ancak bellek bant genişlikleri $546\text{ GB/sn} - 1.09\text{ TB/sn}$ aralığındadır. Bir H200 ($4.8\text{ TB/sn}$) veya Ironwood TPU ($7.4\text{ TB/sn}$) ile kıyaslandığında bellek veriyolu 7 ila 10 kat daha dar olduğu için token üretim hızı da aynı oranda daha düşüktür.
</details>

<details>
<summary><strong>2. Batch Size arttıkça tekil kullanıcının hızı neden bir miktar düşüyor?</strong></summary>
<br>
Batch Size 1'den 64'e çıktığında model ağırlıkları (70 GB) yine 1 kez okunur ancak 64 kullanıcının KV Cache belleği (örneğin +40 GB) her adımda ek olarak okunmak zorundadır. Ayrıca yüksek Batch Size değerlerinde çip artık "Memory-Bound" olmaktan çıkıp "Compute-Bound" (işlem gücü sınırlı) bölgeye girer. Bu durum kullanıcı başına hızı bir miktar düşürürken, toplam sunucu üretimini (Throughput) 25-40 kat artırır.
</details>

---

## 🚀 Kurulum ve Yayınlama (`aicalc.sysarticles.com`)

Uygulama **Sıfır Bağımlılık (Zero-Build / Single-File Architecture)** prensibiyle tek bir `index.html` dosyası olarak tasarlanmıştır. Derleme (build) veya Node.js sunucusu gerektirmez.

### 1. Yerel Ortamda Çalıştırma
```bash
git clone https://github.com/sysarticles/aicalc.git
cd aicalc
python3 -m http.server 8080
# Tarayıcıda http://localhost:8080 adresine gidin
```

### 2. Alt Alan Adında (`aicalc.sysarticles.com`) Yayınlama
* **Cloudflare Pages / Vercel / Netlify:** Depoyu bağlayın veya `index.html` dosyasını sürükleyip bırakın, ardından özel alan adı (Custom Domain) olarak `aicalc.sysarticles.com` CNAME kaydını tanımlayın.
* **Nginx Web Sunucusu Konfigürasyonu:**

```nginx
server {
    listen 80;
    server_name aicalc.sysarticles.com;
    root /var/www/aicalc.sysarticles.com;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

## 🌐 SysArticles Hakkında & Bağlantılar

Bu araç **SysArticles** bünyesinde yapay zeka altyapısı, bulut mimarisi ve sistem mühendisliği üzerine yapılan teknik analizlerin bir parçası olarak geliştirilmiştir.

* 🌍 **Web Sitesi & Makaleler:** [sysarticles.com](https://sysarticles.com)
* 🧮 **Canlı Hesaplayıcı:** [aicalc.sysarticles.com](https://aicalc.sysarticles.com)
* 💼 **LinkedIn:** [SysArticles / Profil Bağlantınız](#)
* 🐙 **GitHub:** [github.com/sysarticles](#)

---

## 📄 Lisans

MIT Lisansı altında açık kaynak olarak sunulmuştur. Kaynak göstererek (`aicalc.sysarticles.com`) dilediğiniz gibi geliştirebilir, çatallayabilir (fork) ve projelerinizde kullanabilirsiniz.