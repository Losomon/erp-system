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
| 2 | Identity & security (auth, organizations, users, roles, permissions, audit logs) | ⏳ Next |
| 3 | Core ERP (dashboard, CRM, customers, products, sales, invoices, payments, inventory) | Planned |
| 4 | Business operations (suppliers, procurement, POs, warehouses, stock transfers, expenses) | Planned |
| 5 | Advanced modules (HR & payroll, projects, manufacturing, assets, reports & BI) | Planned |
| 6 | Intelligence (AI assistant, forecasting, smart alerts, natural-language reporting) | Planned |

## First milestone (target flow)

```text
Register → Create Organization → Login → Dashboard →
Create Customer → Create Product → Create Sales Order →
Update Inventory → Generate Invoice → Record Payment → Dashboard Updates
```

Step 2 builds Register/Login/Organization/Dashboard-shell. Step 3 builds
the rest of the flow.
