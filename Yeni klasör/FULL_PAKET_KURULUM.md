# VipTaksi Full Paket Kurulum Rehberi

Bu rehber, full paket (admin + website + backend) alan musteriler icindir.

## Paket kapsami

- `apps/admin`
- `apps/website`
- `backend`
- `docker-compose.yml`

## Gereksinimler

- Node.js 18+
- npm
- Docker Desktop (PostgreSQL icin)

## 1) Veritabanini baslat

Proje kok dizininde:

```bash
npm run db:up
```

Bu komut `docker-compose.yml` icindeki PostgreSQL servisini ayaga kaldirir.

## 2) Backend kurulumu

```bash
cd backend
npm install
```

### Ortam degiskenleri

`backend/.env.example` dosyasini `backend/.env` olarak kopyalayin ve duzenleyin.

Asgari alanlar:
- `DATABASE_URL` (veya `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`)
- `JWT_SECRET`
- `PORT` (varsayilan 4000)
- `CORS_ORIGIN` (admin adresini icermeli)

## 3) Veritabani semasi ve temel seed

```bash
cd backend
npm run db:schema
npm run db:seed
```

## 4) Demo veri basma (opsiyonel)

### Ingilizce demo (satis/demo modu)
```bash
cd backend
# PowerShell:
$env:DEMO_SEED_LOCALE="en"
npm run db:seed-demo
```

### Turkce demo
```bash
cd backend
# PowerShell:
$env:DEMO_SEED_LOCALE="tr"
npm run db:seed-demo
```

Not:
- Demo seed scripti eski demo kullanicilarini temizler.
- TR+EN karisik liste birakmaz.

## 5) Servisleri calistir

### A) Tek komutla (koku dizinde)
```bash
npm run dev
```

Bu komut ayni anda:
- `apps/admin`
- `apps/website`
- `backend`
servislerini calistirir.

### B) Ayrı ayrı calistirma

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd apps/admin
npm run dev
```

Terminal 3:
```bash
cd apps/website
npm run dev
```

## 6) Build dogrulama

```bash
cd apps/admin
npm run build
```

```bash
cd apps/website
npm run build
```

## Sik sorunlar

### "API baglanmiyor"
- Backend ayakta mi kontrol et (`http://localhost:4000/health`).
- `CORS_ORIGIN` dogru mu kontrol et.

### "DB hatasi aliyorum"
- `npm run db:up` calisti mi kontrol et.
- 5432 portu baska servisle cakisiyor mu kontrol et.

### "Admin login olmuyor"
- `db:seed` tamamlandi mi kontrol et.
- `.env` icindeki `JWT_SECRET` ve DB ayarlari dogru mu kontrol et.

