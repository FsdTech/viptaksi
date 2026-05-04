# README FIRST - Quick Start (UI Kit)

Bu dosya, sadece UI Kit (tasarim paketi) alan musterinin projeyi hizli sekilde acmasi icin hazirlandi.

## Gereksinimler

- Node.js 18+
- npm
- Docker Desktop

## Ilk adimlar

### 1) Admin panel bagimliliklarini yukle

```bash
cd apps/admin
npm install
```

### 2) Admin paneli calistir

```bash
cd apps/admin
npm run dev
```

### 3) Website bagimliliklarini yukle (UI)

```bash
cd apps/website
npm install
```

### 4) Website'i calistir (UI)

```bash
cd apps/website
npm run dev
```

### 5) Build/preview kontrolu (opsiyonel)

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

## UI Kit kapsam notu (onemli)

Bu paket sadece arayuz kodlarini icerir:
- `apps/admin`
- `apps/website`

Bu pakette dahil degildir:
- `backend` API
- veritabani semasi/seed
- canli auth/odeme/realtime backend akislar

Yani tasarim/UI calisir; canli veri akisinin tam calismasi icin full paket gerekir.

## Beklenen local adresler

- Admin panel: `http://localhost:5173` (port degisebilir)
- Website: `http://localhost:5174` (port degisebilir)

