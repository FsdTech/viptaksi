# VipTaksi UI Kit Kurulum Rehberi

Bu rehber, sadece UI Kit (frontend tasarim paketi) alan musteriler icindir.

## Paket kapsami

UI Kit paketinde sadece:
- `apps/admin`
- `apps/website`

bulunur.

## Onemli not

Bu paket tasarim odaklidir.
- Backend API dahil degildir.
- Veritabani dahil degildir.
- Canli is akislari (auth, odeme, realtime) backend olmadan tam calismaz.

## Gereksinimler

- Node.js 18 veya ustu
- npm

## Kurulum

### 1) Admin panel

```bash
cd apps/admin
npm install
npm run dev
```

Varsayilan local adres: `http://localhost:5173` (port bos degilse degisebilir).

### 2) Website arayuzu

Yeni terminal:

```bash
cd apps/website
npm install
npm run dev
```

## Build alma (teslim/preview)

### Admin
```bash
cd apps/admin
npm run build
npm run preview
```

### Website
```bash
cd apps/website
npm run build
npm run preview
```

## Sik sorulan durumlar

### "Veriler neden gelmiyor?"
Cunku UI Kit paketinde backend API/veritabani yoktur.

### "Login neden tam calismiyor?"
Gercek auth akislarinin calismasi icin backend gerekir.

### "Bu paketi nasil canli sisteme ceviririm?"
Full Paket (frontend + backend + db) gerekir.

