# Demo Seed Locale Rehberi

Bu not, satis/sunum asamasinda demo veriyi dil bazli yonetmek icin hazirlandi.

## Yapilan gelistirme

- `backend/src/scripts/seedDemoData.js` locale destekli hale getirildi.
- Desteklenen locale degerleri:
  - `en` -> Ingilizce demo isimleri
  - `tr` -> Turkce demo isimleri
- Varsayilan locale `en` (eger `DEMO_SEED_LOCALE` set edilmezse).
- Yeni seed basmadan once script eski demo kullanicilarini temizler:
  - `driver.*@demo.local`
  - `rider.*@demo.local`

Bu sayede Turkce ve Ingilizce demo kullanicilar ayni anda karisik gorunmez.

## Demo isim setleri

### Ingilizce (`DEMO_SEED_LOCALE=en`)

- Yolcular: `John Smith`, `Emma Johnson`, `Michael Brown`, `Olivia Taylor`
- Soforler: `David Wilson`, `Daniel Miller`, `Sophia Davis`, `Oliver Carter`

### Turkce (`DEMO_SEED_LOCALE=tr`)

- Yolcular: `Ayse Demir`, `Fatma Kaya`, `Selin Aydin`, `Zeynep Koc`
- Soforler: `Ahmet Yilmaz`, `Mehmet Kaya`, `Ali Veli`, `Murat Sahin`

## Komutlar (PowerShell)

### Ingilizce demo veri (satis modu)

```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="en"
npm run db:seed-demo
```

### Turkce demo veri

```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="tr"
npm run db:seed-demo
```

Seed sonrasi admin panelde `Ctrl+F5` ile hard refresh yap.

## Beklenen sonuc

- `en` calistirilirsa sadece Ingilizce yolcu/sofor demo kullanicilar gorunur.
- `tr` calistirilirsa sadece Turkce yolcu/sofor demo kullanicilar gorunur.
- TR+EN karisik demo liste kalmaz.
Add script:
"dev": "concurrently \"npm run dev --prefix apps/admin\" \"npm run dev --prefix apps/website\" \"npm run dev --prefix backend\""