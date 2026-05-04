# VipTaksi - CodeCanyon Satis Rehberi (TR)

Bu dokuman, urunu pazar yerinde (CodeCanyon vb.) dogru konumlandirmak, paketlemek ve teslim etmek icin hazirlanmistir.

---

## 1) Sadece UI Kit Satisi (Tasarim Paketi)

### Musteri ne alir?
- Admin panel arayuzu (UI ekranlari)
- Website/landing arayuzu
- Yeniden kullanilabilir frontend component yapisi
- Hazir demo gorunum

### Neler dahil degildir?
- Backend API kaynak kodu
- Veritabani semasi ve backend scriptleri
- Production deployment/altyapi kurulumu

### En uygun senaryo
Sadece premium bir arayuz alip kendi backend'ine baglamak isteyen musteriler.

### Ilan aciklamasi icin onerilen net ifade
> "Bu paket UI odaklidir. Backend/is kurallari UI Kit lisansina dahil degildir."

---

## 2) Full Paket Satisi (Frontend + Backend)

### Musteri ne alir?
- `apps/admin` (yonetim paneli)
- `apps/website` (website frontend)
- `backend` (API, auth, realtime/socket, data akislar)
- Kurulum ve ortam degiskenleri dokumantasyonu

### Teslim oncesi kontrol listesi
1. Demo veriyi Ingilizce seed et (satis modu):
   - `cd "c:\Users\FSD\Desktop\viptaksi\backend"`
   - `$env:DEMO_SEED_LOCALE="en"`
   - `npm run db:seed-demo`
2. Build dogrulama:
   - `apps/admin` -> `npm run build`
   - `apps/website` -> `npm run build`
3. Gizli bilgileri temizle:
   - gercek `.env` degerleri
   - API key'ler
   - SMTP sifreleri
4. Dokumanda su basliklar olsun:
   - kurulum
   - ortam degiskenleri
   - demo seed kullanimi
   - temel deployment adimlari

### En uygun senaryo
Hem UI hem backend mantigi hazir bir taksi platform baslangici isteyen musteriler.

---

## 3) Kendi Hostinginde Kullanim

### Hedef
VipTaksi'yi kendi altyapinda calistirmak ve tam kontrol sahibi olmak.

### Production icin zorunlu adimlar
1. Guvenli ortam degiskenleri:
   - `DATABASE_URL`
   - guclu `JWT_SECRET`
   - SMTP ayarlari
   - net CORS domainleri
2. Varsayilan admin/demo sifrelerini degistir.
3. Demo hesaplarini production'dan kaldir veya ayri ortamda tut.
4. Operasyonel temel kurulum:
   - reverse proxy (Nginx/Caddy)
   - process manager (PM2/systemd)
   - SSL
   - otomatik DB yedegi + izleme

---

## Demo Veri Dilini Degistirme (TR/EN)

Demo seed scripti locale destekler ve artik TR+EN karisik kullanici olusturmaz.

### Ingilizce demo (satis icin onerilen)
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="en"
npm run db:seed-demo
```

### Turkce demo
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="tr"
npm run db:seed-demo
```

### Onemli davranis
- Script once eski demo kullanicilarini siler:
  - `driver.*@demo.local`
  - `rider.*@demo.local`
- Sonuc: TR ve EN kullanicilar ayni listede karisik gorunmez.

---

## CodeCanyon Icin Onerilen Konumlandirma

### Urun baslik stili
**VipTaksi - Taxi Booking Admin Dashboard + Backend Starter**

### One cikan satis noktalari
- Modern premium admin UI
- Realtime uyumlu backend mimarisi
- Locale bazli demo data yonetimi
- Moduler ve ozellestirilebilir yapi
- Startup MVP ve ajans teslimi icin uygun

### Musteri beklentisini netlestir
Ilanda mutlaka acik yaz:
- UI Kit ve Full Paket farki
- Kurulum sorumluluklari
- Destek kapsaminda neler var/neler yok

---

## Iceride Kisa Operasyon Akisi

1. Musteri demosundan once EN seed calistir.
2. Teslimden once gizli verileri temizle, build al.
3. Production oncesi guvenlik sertlestirmesi yap, demo hesaplari kapat.
4. Buyuk degisikliklerden once tarihli zip yedek al.

