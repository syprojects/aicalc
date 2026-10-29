import { BookOpen, ChevronDown, Compass, Lightbulb, Wrench } from 'lucide-react';
import { Card } from './ui';

const ROADMAP = [
  { t: 'Ne yapacağını belirle', d: 'Kişisel asistan mı, şirket içi sohbet mi, müşteriye açık API mi? Kullanıcı sayısı ve gereken hız buradan çıkar.' },
  { t: 'Modeli seç', d: '8B modeller tek ekran kartında koşar; 32B-70B kalite sıçraması verir; MoE modeller büyük bellek ama yüksek hız ister.' },
  { t: 'Kuantizasyonu belirle', d: 'Ev kullanımında Q4_K_M, sunucuda FP8 en dengeli seçimdir. FP16 genellikle gereksiz bellek harcar.' },
  { t: 'Belleğe sığdır', d: 'Ağırlık + kullanıcı başına KV cache + ~%5 çalışma alanı toplam belleği geçmemeli. Bu sitedeki yeşil/kırmızı şerit tam olarak bunu söyler.' },
  { t: 'Hızı bant genişliğiyle doğrula', d: 'Kabaca: token/sn ≈ bant genişliği ÷ model boyutu. 1 TB/sn ve 35 GB model ≈ 28 tok/sn.' },
  { t: 'Kirala, ölç, sonra satın al', d: 'Önce saatlik bulut GPU ile gerçek iş yükünü test edin; başabaş süresi 12 aydan kısaysa satın alma mantıklıdır.' },
];

const RULES = [
  ['Model boyutu (GB)', 'Parametre (B) × bit ÷ 8 — ör. 70B × 4.5 bit ÷ 8 ≈ 39 GB'],
  ['Hızlı tahmin', 'tok/sn ≈ bant genişliği (GB/sn) ÷ model boyutu (GB)'],
  ['Okuma hızı', 'İnsan ~5 tok/sn okur; 20+ tok/sn akıcı hissettirir'],
  ['KV cache', 'Llama 70B, 8K bağlam, FP16 ≈ 2,7 GB / kullanıcı'],
  ['Çoklu GPU', '2 kart ≈ 1,8× bant genişliği; NVLink yoksa PCIe ile kayıp artar'],
  ['Teorik tavan', 'Gerçek dünyada bu değerlerin %50-85\'i elde edilir'],
];

const GLOSSARY = [
  ['VRAM / HBM', 'Ekran kartının kendi belleği. Modelin tamamı buraya sığmalı. HBM, sunucu çiplerindeki çok hızlı bellek türüdür.'],
  ['Bant genişliği', 'Belleğin saniyede çipe taşıyabildiği veri (GB/sn). LLM hızını belirleyen bir numaralı etken.'],
  ['Token', 'Modelin işlediği metin parçası. Türkçe\'de 1 kelime ortalama 2-3 token eder.'],
  ['Kuantizasyon', 'Ağırlıkları 16 bit yerine 8 / 4 bit ile saklamak. Boyut ve hız kazancı sağlar, az miktarda kalite kaybı olur.'],
  ['KV cache', 'Sohbet geçmişinin dikkat (attention) katmanlarındaki özeti. Bağlam ve kullanıcı sayısıyla doğru orantılı büyür.'],
  ['Batch size', 'Aynı anda işlenen istek sayısı. Ağırlıklar bir kez okunup herkese kullanıldığı için toplam verim artar.'],
  ['MoE', 'Mixture of Experts: model çok sayıda "uzman" alt ağdan oluşur, her token için sadece birkaçı çalışır.'],
  ['TTFT', 'Time To First Token: istemi gönderdikten sonra ilk kelimenin görünmesine kadar geçen süre.'],
  ['ITL', 'Inter-Token Latency: ardışık iki token arasındaki süre. 50 ms ≈ 20 tok/sn.'],
  ['Tensor Parallelism', 'Modeli birden fazla çipe bölüp birlikte çalıştırmak. Bellek ve bant genişliği toplanır.'],
  ['Prefill / Decode', 'Prefill: istemin tek seferde işlenmesi (işlem gücü sınırlı). Decode: yanıtın token token üretilmesi (bellek sınırlı).'],
  ['Spekülatif çözme', 'Küçük bir taslak modelin tahmin ettiği token\'ları büyük modelin toplu doğrulaması; düşük yükte 1.5-2× hız.'],
];

const STACK = [
  { who: 'Yeni başlayan (Windows / Mac / Linux)', tools: 'Ollama, LM Studio, Jan', why: 'Tek tıkla kurulum, GGUF modelleri otomatik indirir. Tek kullanıcı için ideal.' },
  { who: 'Apple Silicon', tools: 'MLX, LM Studio (MLX motoru), llama.cpp', why: 'Unified Memory\'yi en verimli kullanan çatı MLX\'tir.' },
  { who: 'Meraklı / ev sunucusu', tools: 'llama.cpp, KoboldCpp, Open WebUI', why: 'GPU + CPU karışık çalıştırma, ince ayar ve web arayüzü.' },
  { who: 'Şirket içi çok kullanıcılı', tools: 'vLLM, SGLang, LMDeploy', why: 'Continuous batching, PagedAttention ve OpenAI uyumlu API.' },
  { who: 'NVIDIA\'da maksimum performans', tools: 'TensorRT-LLM, NVIDIA NIM, Dynamo', why: 'FP8/FP4 çekirdekler ve dağıtık servis.' },
  { who: 'AMD Instinct / Radeon', tools: 'vLLM (ROCm), SGLang, llama.cpp (Vulkan/HIP)', why: 'ROCm 6+ ile vLLM üretim seviyesinde destekli.' },
  { who: 'Google TPU', tools: 'vLLM TPU, JetStream, MaxText', why: 'XLA derleyicisi üzerinden TPU\'ya optimize servis.' },
];

const FAQ = [
  ['Mac Studio çok bellekli ama neden sunucu GPU\'larından yavaş?', 'Apple Ultra çipleri 512 GB\'a kadar belleğe sahiptir ama bant genişliği ~0,8 TB/sn\'dir. H200 4,8 TB/sn, B200 8 TB/sn sunar. Büyük modeli sığdırır ama 6-10 kat yavaş üretir. Tek kişilik kullanım için yine de en sessiz ve verimli çözümdür.'],
  ['Kullanıcı sayısı artınca kişi başı hız neden azalıyor?', 'Her adımda model ağırlıkları bir kez okunur ama her kullanıcının KV cache\'i de ayrıca okunur. Batch çok büyüyünce işlem gücü de sınıra dayanır. Kişi başı hız biraz düşerken toplam üretim 10-40 kat artar.'],
  ['MoE modeller neden hem çok bellek hem de yüksek hız istiyor?', 'Tüm uzmanlar bellekte durmak zorundadır (ör. DeepSeek 671B). Tek kullanıcıda yalnızca 37B aktif okunduğu için hızlıdır; ama çok kullanıcıda farklı token\'lar farklı uzmanlara gider ve okunan veri toplam modele yaklaşır. Hesaplayıcı bunu otomatik modeller.'],
  ['Q4 kuantizasyon kaliteyi çok düşürür mü?', 'Q4_K_M ve AWQ gibi modern yöntemlerde kayıp genellikle %1-3 civarındadır. 70B Q4 model çoğu görevde 32B FP16 modelden daha iyidir. Kod ve matematikte Q6/FP8 daha güvenlidir.'],
  ['Ekran kartı olmadan, sadece işlemciyle çalışır mı?', 'Evet, llama.cpp ile çalışır ama sistem RAM bant genişliği 50-120 GB/sn olduğu için 8B Q4 modelde ~10-20 tok/sn, 70B modelde 1-2 tok/sn beklenir. Ryzen AI Max ve DGX Spark gibi birleşik bellekli sistemler iyi bir ara çözümdür.'],
  ['İki farklı ekran kartını birlikte kullanabilir miyim?', 'llama.cpp ve vLLM katmanları kartlara bölebilir; ancak en yavaş kart darboğaz olur. Aynı model kartlar en öngörülebilir sonucu verir.'],
  ['Bu hesaplar ne kadar doğru?', 'Roofline modeli teorik üst sınırı verir. Gerçek dünyada yazılım, çekirdek optimizasyonu ve bağlam doluluğuna göre bu değerlerin %50-85\'i görülür. Satın alma kararı öncesi saatlik bulut GPU\'da test etmenizi öneririz.'],
  ['Google TPU satın alınabilir mi?', 'Hayır, TPU\'lar yalnızca Google Cloud üzerinden kiralanır. Bu yüzden maliyet bölümünde satın alma seçeneği görünmez.'],
];

export function Guide() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Compass className="h-4 w-4 text-neon-cyan" /> 6 adımda doğru donanım
          </h3>
          <ol className="space-y-3">
            {ROADMAP.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 font-mono text-xs font-bold text-ink-950">{i + 1}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{s.t}</div>
                  <div className="text-xs leading-relaxed text-slate-400">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Lightbulb className="h-4 w-4 text-neon-amber" /> Akılda tutulacak kurallar
            </h3>
            <dl className="space-y-2.5">
              {RULES.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-3 text-xs">
                  <dt className="font-semibold text-neon-amber">{k}</dt>
                  <dd className="font-mono text-slate-300">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Wrench className="h-4 w-4 text-neon-lime" /> Hangi yazılımla çalıştırmalı?
            </h3>
            <ul className="space-y-2.5">
              {STACK.map((s) => (
                <li key={s.who} className="text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-semibold text-white">{s.who}</span>
                    <span className="font-mono text-neon-lime">{s.tools}</span>
                  </div>
                  <div className="text-slate-400">{s.why}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <BookOpen className="h-4 w-4 text-neon-violet" /> Sözlük
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/5 bg-ink-900/50 p-3 transition hover:border-neon-violet/40">
              <div className="mb-1 font-mono text-xs font-bold text-neon-violet">{k}</div>
              <div className="text-xs leading-relaxed text-slate-400">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="glass group rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export const FAQ_ITEMS = FAQ;
