<div align="center">

# HomeschoolTracker

### The world's most advanced, enterprise-grade, AI-adjacent homeschool management platform.

[![Build](https://github.com/tylrd/homeschooltracker/actions/workflows/publish.yml/badge.svg)](https://github.com/tylrd/homeschooltracker/actions/workflows/publish.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

*Revolutionizing the kitchen-table educational experience since 2025.*

---

**17 stars** &middot; **1 contributor** &middot; **0 issues** (we don't have bugs, only undocumented features)

</div>

---

## Why HomeschoolTracker?

Because your child's education deserves the same caliber of tooling that Fortune 500 companies use to track quarterly OKRs.

Other families use spreadsheets. Some use paper planners. A brave few use *nothing at all*. But you? You demand **type-safe lesson plans**, **relationally-modeled student data**, and **server-side rendered daily notes** &mdash; delivered at the speed of React 19 streaming.

HomeschoolTracker isn't just an app. It's a **paradigm shift** in domestic pedagogy infrastructure.

## Features

- **Student Management** &mdash; Full CRUD for your most important stakeholders (your children).
- **Subject Tracking** &mdash; Because "math" and "reading" deserve their own database rows.
- **Lesson Plans** &mdash; Plan lessons with the rigor of a NASA mission timeline. Calendar view included.
- **Resource Library** &mdash; Catalog every workbook, video, and questionable YouTube playlist.
- **Daily Notes** &mdash; Capture the nuance of each school day. "Refused to do long division" has never been so well-indexed.
- **Dark Mode** &mdash; For those 5 AM planning sessions before the kids wake up.

## Tech Stack

This is not a toy. This is a **production-grade, vertically-integrated, full-stack TypeScript monolith**:

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1 (App Router, React Server Components) |
| Language | TypeScript 5 (strict mode, obviously) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Database | PostgreSQL 16, Drizzle ORM |
| Runtime | Node.js 20 |
| Deployment | Docker, GitHub Actions, GHCR |

## Quick Start (Production)

Deploy the entire platform in under 60 seconds. Investors love velocity.

```bash
# Clone the repository
git clone https://github.com/tylrd/homeschooltracker.git
cd homeschooltracker/deploy

# Configure your environment
cp .env.example .env
# Edit .env with your preferred credentials

# Launch
docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000). That's it. You just deployed a world-class homeschool management system.

## Development Setup

For contributors and those who like to live on the edge:

```bash
# Install dependencies
pnpm install

# Configure local environment variables (required)
cp .env.example .env.local
# Edit .env.local and set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_BASE_URL

# Start the database
pnpm docker:up

# Push the schema
pnpm db:push

# (Optional) Seed with sample data
pnpm db:seed

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and begin your journey.

### Local Auth Debugging

Use the debug endpoint to confirm whether the server sees your auth cookie:

- Before login, `GET /api/debug/session` returns `null`.
- After login, `GET /api/debug/session` returns JSON with `userId` and `activeOrganizationId`.

If login succeeds but this endpoint stays `null`, verify that `.env.local` has valid
`BETTER_AUTH_BASE_URL` and `BETTER_AUTH_SECRET` values and restart `pnpm dev`.

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |
| `pnpm docker:up` | Start PostgreSQL container |
| `pnpm docker:down` | Stop PostgreSQL container |

## Contributing

We take contributions to HomeschoolTracker with the utmost seriousness. This project is the backbone of at least one family's educational infrastructure, and we will not compromise on quality.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/quantum-gradebook`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

All PRs are automatically built and published to GHCR. We don't have a test suite yet, but we do have *confidence*.

## License

MIT
