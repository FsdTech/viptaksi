# FULL README FIRST - Quick Start (Full Package)

Bu dosya full paket (admin + website + backend) icindir.

## Paket kapsami

- `apps/admin`
- `apps/website`
- `backend`
- `docker-compose.yml`

## Gereksinimler

- Node.js 18+
- npm
- Docker Desktop

## Ilk 5 adim

### 1) Veritabani
Proje kokunde:
```bash
npm run db:up
```

### 2) Backend bagimliliklari
```bash
cd backend
npm install
```

### 3) Backend env
- `backend/.env.example` dosyasini `backend/.env` olarak kopyala
- `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` vb. doldur

### 4) DB schema + seed
```bash
cd backend
npm run db:schema
npm run db:seed
```

### 5) Servisleri calistir
Proje kokunde:
```bash
npm run dev
```

## Demo dili (opsiyonel)

English demo:
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="en"
npm run db:seed-demo
```

Turkce demo:
```powershell
cd "c:\Users\FSD\Desktop\viptaksi\backend"
$env:DEMO_SEED_LOCALE="tr"
npm run db:seed-demo
```

## Kontrol adresleri

- Backend health: `http://localhost:4000/health`
- Admin: `http://localhost:5173`
- Website: `http://localhost:5174`

## Is bitince DB kapatma
```bash
npm run db:down
```
