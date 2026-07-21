# Atelier ERP

A modular, multi-tenant ERP platform. This repository is the foundation
described in the build roadmap — Step 1 of 6.

## Status: Step 1 — Project Foundation ✅

What's in place:

- **Monorepo** using npm workspaces (`apps/*`, `packages/*`)
- **`apps/api`** — NestJS backend, TypeScript, connected to Postgres via Prisma
- **`apps/web`** — Next.js (App Router) frontend, TypeScript, Tailwind CSS
- **`database/prisma`** — shared Prisma schema (`Organization`, `User`,
  `Membership` for now — full RBAC arrives in Step 2)
- **Docker** — `docker-compose.yml` runs Postgres, Redis, the API, and the
  web app together
- **`.env.example`** — every environment variable the stack needs

The web app currently renders a single status page that calls
`GET /api/health` on the API, which in turn runs a real query against
Postgres. If you see "Database: connected", the entire chain — browser →
Next.js → NestJS → Prisma → Postgres — is wired correctly.

## Project structure

```text
atelier-erp/
│
├── apps/
│   ├── web/                 # Next.js ERP frontend
│   └── api/                 # NestJS backend
│
├── packages/
│   ├── types/                # Shared TypeScript types
│   ├── config/                # Shared constants/config
│   └── eslint-config/         # Shared lint rules
│
├── database/
│   └── prisma/
│       └── schema.prisma
│
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
│
├── docker-compose.yml
├── .env.example
└── package.json
```

## Running it locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if you want non-default ports/passwords
```

### 3. Start Postgres + Redis

```bash
npm run docker:up
```

This starts only the infra containers by default if you comment out
`api`/`web` in `docker-compose.yml` while developing locally with hot
reload — or run everything in Docker with `docker compose up`. Either
approach works; the instructions below assume you're running `api`/`web`
directly with npm for the fastest dev loop.

### 4. Generate the Prisma client and run the first migration

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start the API and the web app

```bash
npm run dev
# or individually:
npm run dev:api
npm run dev:web
```

- API: http://localhost:4000/api/health
- Web: http://localhost:3000

## Roadmap

| Step | Scope | Status |
|------|-------|--------|
| 1 | Project foundation (monorepo, Next.js, NestJS, Postgres, Prisma, Docker, env) | ✅ Done |
| 2 | Identity & security (auth, organizations, users, roles, permissions, audit logs) | ✅ Done |
| 3 | Core ERP (dashboard, CRM, customers, products, sales, invoices, payments, inventory) | ⏳ Next |
| 4 | Business operations (suppliers, procurement, POs, warehouses, stock transfers, expenses) | Planned |
| 5 | Advanced modules (HR & payroll, projects, manufacturing, assets, reports & BI) | Planned |
| 6 | Intelligence (AI assistant, forecasting, smart alerts, natural-language reporting) | Planned |

## Step 2 — what's implemented

**Auth (`apps/api/src/auth`)**

```text
POST /api/auth/register   → create account, auto-login
POST /api/auth/login      → email + password → tokens
POST /api/auth/refresh    → rotate refresh token, issue new access token
POST /api/auth/logout     → revoke refresh token
GET  /api/auth/me         → current user + their organizations
```

- Passwords hashed with bcrypt (12 rounds).
- Access tokens are short-lived JWTs (15m default), returned in the response
  body — the web app keeps them in memory only, never localStorage.
- Refresh tokens are opaque random strings, stored server-side as a SHA-256
  hash, delivered as an httpOnly cookie scoped to `/api/auth`, and **rotated**
  on every use (old one revoked, new one issued) to limit replay risk.

**Organizations & multi-tenancy (`apps/api/src/organizations`)**

```text
POST /api/organizations                → create org, creator becomes Owner
GET  /api/organizations                → list my organizations
GET  /api/organizations/:id            → org detail (requires membership)
GET  /api/organizations/:id/members    → member list (requires membership)
GET  /api/organizations/:id/roles      → roles + permissions (requires membership)
GET  /api/organizations/:id/audit-logs → requires `audit_logs.read` permission
```

Every `:id`-scoped route (or any route sent with an `x-organization-id`
header) goes through `OrganizationGuard`, which confirms the caller has a
`Membership` in that organization before attaching their role and resolved
permissions to the request.

**RBAC (`packages/config/roles.ts`, `packages/config/permissions.ts`)**

Every organization is seeded with six default roles at creation time —
Owner, Admin, Manager, Accountant, Sales Staff, Employee — each mapped to a
subset of the global permission catalog (`customers.read`, `invoices.approve`,
etc.). `PermissionsGuard` + the `@RequirePermissions()` decorator enforce
these on individual routes.

**Audit logs (`apps/api/src/audit`)**

`AuditService.log()` is called on registration, login, failed login, logout,
and organization creation. It never throws into the caller — a logging
failure won't roll back the business action it's recording.

**Frontend (`apps/web/src/app`)**

```text
/                   → status page + Create account / Sign in
/register           → create account → redirects to /organizations/new
/login              → sign in → redirects to /dashboard
/organizations/new  → create an organization (protected)
/dashboard          → lists the user's organizations (protected)
```

`AuthProvider` (`src/context/auth-context.tsx`) restores a session on page
load by calling `/auth/refresh` against the httpOnly cookie, then `/auth/me`.
`ProtectedRoute` redirects to `/login` if that fails.

### A note on `prisma generate` in this environment

The Prisma query engine binary is fetched from `binaries.prisma.sh` at
`generate` time. If your network blocks that domain (as a sandboxed dev
environment might), `npm run db:generate` will fail with a 403. This isn't a
schema or code problem — it will work normally on a machine, CI runner, or
Docker build with standard internet access. Run `npm run db:seed` after
migrating to populate the permission catalog.

## First milestone (target flow)

```text
Register → Create Organization → Login → Dashboard →
Create Customer → Create Product → Create Sales Order →
Update Inventory → Generate Invoice → Record Payment → Dashboard Updates
```

Step 2 builds Register/Login/Organization/Dashboard-shell. Step 3 builds
the rest of the flow.
