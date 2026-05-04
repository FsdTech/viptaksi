# VipTaksi Kullanim Senaryolari (Satis ve Operasyon)

Bu dokuman projeyi 3 farkli sekilde kullanman/satman icin pratik yol haritasi verir:

1. UI Kit olarak satis
2. Full paket (frontend + backend) satis
3. Kendi hostinginde canli kullanim

---

## 1) Sadece UI Kit (Tasarim) Satisi

Bu modelde musterinin aldigi sey:
- Admin panel UI (ekranlar, componentler, tema)
- Website UI (landing/temel arayuz)
- Ornek demo goruntusu

Bu modelde verilmemesi gerekenler:
- Backend kaynak kodu
- Veritabani semalari ve seed scriptleri
- Sunucu/altyapi dosyalari

### Hazirlik adimlari

1. Demo dili sec (satis icin EN onerilir):
   - `backend` icinde:
   - PowerShell:
   - `cd "c:\Users\FSD\Desktop\viptaksi\backend"`
   - `$env:DEMO_SEED_LOCALE="en"`
   - `npm run db:seed-demo`
2. Admin ve website ekran goruntuleri/video demo hazirla.
3. Paket aciklamasinda "UI Kit, backend dahil degil" notunu net yaz.

### Satis notu

- Bu modelde aliciya "sadece arayuz ve frontend yapisi" verdigini acikca belirt.
- Canli API/odeme/soket ozellikleri bu pakete dahil olmamali.

---

## 2) Full Paket Satisi (Ticari Lisans)

Bu modelde musterinin aldigi sey:
- `apps/admin` (panel)
- `apps/website` (landing/frontend)
- `backend` (API + socket + auth + db akislari)
- Kurulum dokumani + .env ornekleri + deployment notlari

### Satis oncesi checklist

1. Demo veri dili EN yap:
   - `cd "c:\Users\FSD\Desktop\viptaksi\backend"`
   - `$env:DEMO_SEED_LOCALE="en"`
   - `npm run db:seed-demo`
2. Build kontrol:
   - `apps/admin` -> `npm run build`
   - `apps/website` -> `npm run build`
3. Gizli bilgileri kontrol et:
   - `.env`, API key, SMTP password, JWT secret gercek degerlerini paketleme.
4. Dokuman ekle:
   - Kurulum
   - Ortam degiskenleri
   - Demo dil degistirme
   - Sifir kurulum adimlari

### Musteriye teslim paketi

- Source code + gerekli lock dosyalari
- Veritabani kurulum talimati
- Demo seed komutlari
- Destek sinirlari (neler dahil/neler degil)

---

## 3) Kendi Hostinginde Kullanma (Uretim)

Bu modelde odak:
- Stabillik
- Guvenlik
- Operasyon kolayligi

### Canliya cikmadan once

1. Gercek `.env` degerleri:
   - `DATABASE_URL`
   - `JWT_SECRET` (guclu)
   - SMTP ayarlari
   - CORS domainleri
2. Varsayilan sifreleri degistir:
   - Admin hesaplari
   - Demo hesaplari gerekiyorsa temizle
3. Demo datayi kaldir ya da ayri ortamda tut:
   - Uretimde demo local mailleri tutma
4. DB yedekleme ve log izleme kur:
   - Otomatik backup
   - Hata/uyari monitoru

### Calistirma modeli (onerilen)

- Reverse proxy (Nginx/Caddy)
- Process manager (PM2/systemd)
- PostgreSQL ayri servis
- SSL zorunlu

---

## Demo Dilini Hemen Degistirme (TR/EN)

### English demo (satis modu)
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="en"
npm run db:seed-demo
```

### Turkish demo
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="tr"
npm run db:seed-demo
```

Not:
- Seed script artik once eski demo kullanicilarini temizler.
- Bu sayede TR ve EN isimler ayni anda karisik gorunmez.

---

## Sana Ozel Pratik Plan (Kisa)

1. Satis demosu: her zaman `EN seed` bas.
2. Musteri gorusmesi: UI Kit ve Full paket farkini net anlat.
3. Canliya alirken: demo hesaplari temizle, guvenlik ayarlarini zorunlu yap.
4. Her buyuk degisiklik oncesi zip yedek al.

