# Blues Clues HRIS — Superadmin Portal

Central control panel for the Blues Clues HRIS platform. Manages company tenants, subscriptions, renewals, and system settings.

---

## Default Login Credentials

| Field    | Value                              |
|----------|------------------------------------|
| Email    | bluesclueshrissuperadmin@gmail.com |
| Password | password123                        |

---

## Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Brevo](https://brevo.com) account for email (optional — only needed for renewal reminders)

---

## Clone

```bash
git clone https://github.com/dreiiiiim/blues-clues-hris-superadmin.git
cd blues-clues-hris-superadmin
```

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create `.env`

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Open `backend/.env` and set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=any_random_32_char_string_here
APP_URL=http://localhost:5010
FRONTEND_URL=http://localhost:3010
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@bluesclues.com
BREVO_SENDER_NAME=Blues Clues Superadmin
PORT=5010
```

> **SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY** come from your Supabase project → Settings → API.

### 3. Run the backend

```bash
npm run start:dev
```

Backend runs on `http://localhost:5010`.

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Create `.env.local`

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5010/super-admin
```

### 3. Run the frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:3010`.

---

## Seed Superadmin Account

After the backend is running, seed the default superadmin user once:

```bash
cd backend
npx ts-node ../superadmin/seed-superadmin.ts
```

This creates the account with the credentials listed above. Only needs to be run once.

---

## Project Structure

```
blues-clues-hris-superadmin/
├── backend/          # NestJS API (port 5010)
│   ├── src/
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── dashboard/
│   │   ├── renewals/
│   │   ├── settings/
│   │   └── subscriptions/
│   └── .env.example
└── frontend/         # Next.js 14 App Router (port 3010)
    └── src/
        └── app/
            ├── (auth)/login/
            └── super-admin/
                ├── dashboard/
                ├── companies/
                ├── subscriptions/
                ├── renewals/
                └── settings/
```

---

## Tech Stack

| Layer    | Technology                            |
|----------|---------------------------------------|
| Frontend | Next.js 14, Tailwind CSS, TanStack Query, Framer Motion |
| Backend  | NestJS, Supabase (PostgreSQL)         |
| Auth     | JWT (localStorage)                    |
| Email    | Brevo (Sendinblue)                    |
