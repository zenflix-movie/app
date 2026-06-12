# Zenflix

A Netflix-style movie streaming app built with the [T3 Stack](https://create.t3.gg/).

## Features

- User registration and login
- Multiple profiles per account
- Browse and search videos by category
- HLS video playback
- Reviews and star ratings
- Watch history
- Admin dashboard for users, videos, categories, and reviews

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [NextAuth.js](https://next-auth.js.org)
- [tRPC](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com)
- S3-compatible object storage (RustFS / MinIO)

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- Docker (for local PostgreSQL)

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Generate an auth secret:

   ```bash
   npx auth secret
   ```

4. Start the database:

   ```bash
   ./start-database.sh
   ```

5. Push the schema and seed data:

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

6. Run the dev server:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000).

The seed script creates an admin user: `admin@zenflix.com` / `admin123`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed initial data |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm check` | Run lint and typecheck |

## Environment Variables

See [`.env.example`](.env.example) for required variables:

- `AUTH_SECRET` — NextAuth secret
- `DATABASE_URL` — PostgreSQL connection string
- `RUSTFS_*` — S3-compatible storage credentials
- `NEXT_PUBLIC_APP_URL` — Public app URL
