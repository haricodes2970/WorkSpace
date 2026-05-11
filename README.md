# WorkSpace

Minimalist personal productivity system for solo developers and indie builders.

**Workflow:** Idea Capture → Refinement → Project → Execution → Ship

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | TailwindCSS v4 |
| Components | shadcn/ui + Radix UI |
| Animation | Framer Motion |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| Auth | Supabase Auth (OTP) |
| Monitoring | Sentry |
| Deployment | Vercel |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values from your Supabase project and Sentry.

### 3. Supabase setup

1. Create project at [supabase.com](https://supabase.com)
2. Enable Email OTP in **Authentication → Providers → Email**
   - Disable "Confirm email" (OTP handles it)
   - Set OTP expiry: 600 seconds
3. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Settings → API**
4. Copy `SUPABASE_SERVICE_ROLE_KEY` from same page (keep secret)
5. Get `DATABASE_URL` from **Settings → Database → Connection string → URI**

### 4. Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase (dev)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
app/
  (auth)/          — Login + OTP verify pages (public)
  (dashboard)/     — Protected dashboard routes
  api/auth/        — Auth callback handler
components/
  ui/              — Reusable UI primitives
  layout/          — Sidebar, topbar
features/
  auth/            — Auth components + server actions
lib/
  supabase/        — Client, server, admin clients
  prisma/          — Prisma singleton
  utils.ts         — Shared utilities
  errors.ts        — Error classes
repositories/      — Data access layer (repository pattern)
services/          — Business logic layer
schemas/           — Zod validation schemas
types/             — TypeScript type exports
middleware.ts      — Route protection
```

## Security

- OTP-only auth, no passwords stored
- JWT sessions via secure httpOnly cookies
- Middleware enforces auth on all non-public routes
- RLS-ready Prisma models with soft delete
- Security headers on all routes (CSP, X-Frame, etc.)
- Input sanitized via Zod on every action

## Deployment

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add all env vars in Vercel dashboard
4. Set build command: `prisma generate && next build`
5. Deploy

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run db:studio    # Prisma Studio
npm run db:generate  # Regenerate Prisma client
```
