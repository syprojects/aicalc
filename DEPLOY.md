# Yayınlama Rehberi — aicalc.sysarticles.com

Uygulama derlendiğinde yalnızca statik dosyalardan (`dist/`) oluşur: sunucu, veritabanı, PHP veya Node.js süreci gerekmez. Bu yüzden önerilen yol **GitHub Pages + özel alt alan adı**dır. CloudPanel ile yayınlamak isterseniz alternatif adımlar en sonda.

| | GitHub Pages (önerilen) | CloudPanel |
|---|---|---|
| Maliyet | Ücretsiz | Sunucunuz zaten var |
| SSL | Otomatik (Let's Encrypt) | CloudPanel'den Let's Encrypt |
| Hız | Küresel CDN (Fastly) | Tek sunucu |
| Yayın | `git push` → 1-2 dk sonra canlı | Her seferinde dosya yükleme veya ek CI kurulumu |
| Bakım | Yok | Sunucu güncelleme, disk, yedek |
| Sunucunuza yük | Yok | Var |

---

## A. GitHub Pages ile yayın (önerilen)

### 1. Kodu GitHub'a gönder
```bash
git add -A
git commit -m "v3: React + Vite yeniden yazım"
git push origin main
```

### 2. GitHub Pages'i "GitHub Actions" kaynağıyla aç
1. `https://github.com/syprojects/aicalc/settings/pages` adresine gidin.
2. **Build and deployment → Source**: `GitHub Actions` seçin.
3. **Actions** sekmesinde `Deploy to GitHub Pages` iş akışının yeşil tamamlandığını görün (ilk push'tan sonra başlamadıysa **Run workflow** ile elle başlatın).
4. Site önce `https://syprojects.github.io/aicalc/` adresinde açılır.

### 3. DNS kaydını ekle (sysarticles.com'un DNS'ini yönettiğiniz yerde)
`sysarticles.com` şu an `135.225.107.40` adresine gidiyor; DNS'i hangi panelde yönetiyorsanız (Cloudflare, alan adı firması, CloudPanel sunucusundaki DNS vb.) şu kaydı ekleyin:

| Tür | Ad (Host) | Değer (Hedef) | TTL |
|---|---|---|---|
| `CNAME` | `aicalc` | `syprojects.github.io` | Otomatik / 3600 |

> **Cloudflare kullanıyorsanız:** kaydı ilk aşamada **gri bulut (DNS only)** olarak ekleyin. GitHub sertifikayı aldıktan sonra isterseniz turuncu buluta (proxy) çevirebilirsiniz; o durumda Cloudflare SSL modunu **Full** yapın.

Kontrol (birkaç dakika sürebilir):
```bash
nslookup -type=CNAME aicalc.sysarticles.com
```
Çıktıda `syprojects.github.io` görmelisiniz.

### 4. Özel alan adını GitHub'a tanımla
1. Yine `Settings → Pages` sayfasında **Custom domain** alanına `aicalc.sysarticles.com` yazıp **Save** deyin. (Depodaki `public/CNAME` dosyası da aynı değeri içerir, her yayında korunur.)
2. DNS doğrulaması yeşil olunca **Enforce HTTPS** kutusunu işaretleyin. Sertifikanın hazırlanması 15 dk – 1 saat sürebilir.

### 5. (Önerilir) Alan adını kuruluş düzeyinde doğrula
Başkasının `aicalc.sysarticles.com` adını kendi Pages sitesine bağlamasını engeller:
`https://github.com/organizations/syprojects/settings/pages` → **Add a domain** → `sysarticles.com` → gösterilen `TXT` kaydını DNS'e ekleyin → **Verify**.

### 6. Bundan sonrası
`main` dalına her `git push` testleri çalıştırır, derler ve siteyi 1-2 dakika içinde günceller. Hata olursa Actions sekmesinde kırmızı görünür ve canlı site eski haliyle kalır.

---

## B. CloudPanel ile yayın (alternatif)

1. **DNS:** `aicalc` için `A` kaydı → `135.225.107.40` (CloudPanel sunucunuzun IP'si).
2. **Site oluştur:** CloudPanel → **Add Site** → **Create a Static HTML Site** → Domain: `aicalc.sysarticles.com`. Site kullanıcısını ve şifresini not edin.
3. **SSL:** Site → **SSL/TLS** → **Actions → New Let's Encrypt Certificate** → Create.
4. **Derle (kendi bilgisayarınızda):**
   ```bash
   npm ci
   npm run build
   ```
5. **Yükle:** `dist/` klasörünün **içeriğini** sitenin kök dizinine (`/home/<site-kullanıcısı>/htdocs/aicalc.sysarticles.com/`) kopyalayın — CloudPanel **File Manager** veya SFTP (WinSCP/FileZilla) ile.
   ```bash
   scp -r dist/* <site-kullanıcısı>@135.225.107.40:htdocs/aicalc.sysarticles.com/
   ```
6. **Önbellek (isteğe bağlı):** Site → **Vhost** içinde `server { ... }` bloğuna ekleyin; `assets/` altındaki dosya adları içerik özetli olduğu için uzun süre önbelleğe alınabilir:
   ```nginx
   location /assets/ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```
7. Her güncellemede 4. ve 5. adımları tekrarlayın. Bunu otomatikleştirmek isterseniz GitHub Actions'a SSH anahtarıyla `rsync` adımı eklenebilir; ancak bu iş için GitHub Pages zaten daha az zahmetlidir.

---

## Yerelde geliştirme

```bash
npm install      # ilk sefer
npm run dev      # http://localhost:5173 — kaydettikçe anında yenilenir
npm test         # hesap motoru testleri
npm run build    # dist/ klasörüne üretim derlemesi
npm run preview  # dist/ çıktısını yerelde önizle
```

Donanım eklemek / fiyat güncellemek için `src/data/hardware.ts`, model eklemek için `src/data/models.ts` dosyasını düzenlemeniz yeterli.
