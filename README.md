# INDC Money Management

Sistem manajemen keuangan event berbasis web untuk tim INDC.  
Dibangun dengan **Next.js 15 App Router**, **Supabase**, dan **Tailwind CSS**.

---

## Tech Stack

| Layer     | Teknologi                                |
|-----------|------------------------------------------|
| Frontend  | Next.js 15 (App Router), React 19, TypeScript |
| Styling   | Tailwind CSS + CSS Custom Properties     |
| Backend   | Supabase (PostgreSQL + Auth + Storage)   |
| Deployment| Vercel                                   |

---

## Fitur

- **Login** dengan Supabase Auth
- **Dashboard** — ringkasan statistik + daftar event per kartu
- **Event Management** — buat, kunci, dan kelola event
- **Transaksi** — input income/expense dengan upload bukti gambar (maks. 2MB)
- **Lightbox** — preview gambar bukti tanpa refresh halaman
- **Saldo Global Hybrid** — otomatis dari transaksi + override manual admin
- **Audit Log** — riwayat perubahan saldo oleh admin
- **RLS** — team hanya melihat event miliknya, admin bypass

---

## Struktur Proyek

```
indc-money-management/
├── supabase/
│   └── schema.sql              ← SQL schema lengkap + RLS + Storage
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            ← Redirect ke /dashboard atau /login
│   │   ├── globals.css         ← Design system
│   │   ├── login/
│   │   │   └── page.tsx        ← Halaman login
│   │   ├── dashboard/
│   │   │   ├── page.tsx        ← Dashboard (Server Component)
│   │   │   └── DashboardClient.tsx
│   │   └── events/
│   │       └── [id]/
│   │           ├── page.tsx    ← Detail event (Server Component)
│   │           └── EventDetailClient.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx      ← Header + saldo global + modal edit
│   │   ├── events/
│   │   │   ├── EventCard.tsx   ← Kartu event di dashboard
│   │   │   └── CreateEventModal.tsx
│   │   └── transactions/
│   │       ├── TransactionTable.tsx  ← Tabel + lightbox
│   │       └── AddTransactionForm.tsx ← Form + upload gambar
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       ← Browser client
│   │   │   └── server.ts       ← Server client (SSR)
│   │   ├── actions.ts          ← Server Actions
│   │   └── utils.ts            ← Helper functions
│   ├── types/
│   │   └── index.ts            ← TypeScript interfaces
│   └── middleware.ts           ← Auth middleware
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Cara Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd indc-money-management
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** di Supabase Dashboard
3. Jalankan isi file `supabase/schema.sql` (copy-paste lalu klik Run)
4. Buka **Settings > API** — salin Project URL dan anon key

### 3. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 4. Buat User Admin Pertama

Di **Supabase Dashboard > Authentication > Users**, klik **Add User**:
- Email: `admin@indc.com`
- Password: (isi password)

Lalu di **SQL Editor**, jalankan:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@indc.com'
);
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deploy ke Vercel

```bash
npm install -g vercel
vercel
```

Atau push ke GitHub dan import project di [vercel.com/new](https://vercel.com/new).

**Environment Variables yang perlu diisi di Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Roles & Permissions

| Fitur                      | Team | Admin |
|----------------------------|------|-------|
| Melihat event sendiri      | ✅   | ✅    |
| Melihat semua event        | ❌   | ✅    |
| Buat event                 | ✅   | ✅    |
| Tambah transaksi           | ✅*  | ✅*   |
| Kunci/buka event           | ❌   | ✅    |
| Edit saldo global          | ❌   | ✅    |
| Lihat audit log            | ❌   | ✅    |

*hanya pada event yang belum dikunci

---

## Catatan Teknis

- **RLS** aktif pada semua tabel — team tidak bisa akses data tim lain
- **Trigger SQL** otomatis sinkronisasi `global_balance` setiap kali transaksi berubah
- **Storage bucket** `proofs` — public (bisa diakses via URL), upload hanya untuk user terautentikasi
- **Server Actions** digunakan untuk semua mutasi data (create/update/delete)
- **Middleware** melindungi semua route kecuali `/login`
