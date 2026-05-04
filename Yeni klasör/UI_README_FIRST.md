# UI README FIRST - Quick Start (UI Kit)

Bu dosya sadece UI Kit (tasarim paketi) icindir.

## Paket kapsami

- `apps/admin`
- `apps/website`

## Onemli not

Bu paket sadece arayuz kodu icerir.
- Backend API yok
- Veritabani yok
- Canli auth/odeme/realtime backend akislar yok

## Gereksinimler

- Node.js 18+
- npm

## Hizli baslangic

### 1) Admin panel
```bash
cd apps/admin
npm install
npm run dev
```

### 2) Website
Yeni terminal:
```bash
cd apps/website
npm install
npm run dev
```

## Build/Preview (opsiyonel)

Admin:
```bash
cd apps/admin
npm run build
npm run preview
```

Website:
```bash
cd apps/website
npm run build
npm run preview
```

## Beklenen adresler

- Admin: `http://localhost:5173`
- Website: `http://localhost:5174`

(Portlar doluysa Vite otomatik farkli port verebilir.)
