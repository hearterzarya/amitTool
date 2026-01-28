# Amit Techsolution

Premium tech solutions platform providing affordable access to AI tools and software subscriptions.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon Postgres recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd amit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - Your Neon Postgres connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
- `COOKIE_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`
- Other optional variables as needed

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Sync database schema (choose one method):
# Option A: Push schema directly (recommended for initial setup)
npx prisma db push

# Option B: Use migrations (if you need migration history)
npx prisma migrate dev

# (Optional) Seed the database
npm run db:seed
```

**Troubleshooting:**
- If you see "shadow database" errors, use `npx prisma db push` instead
- If you see missing column errors, run `npx prisma db push` to sync the schema
- See `MIGRATION_GUIDE.md` for detailed migration troubleshooting

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Database

This project uses Prisma with PostgreSQL. The database connection is configured via the `DATABASE_URL` environment variable.

### Migrations

To create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

To apply migrations in production:
```bash
npx prisma migrate deploy
```

## Project Structure

```
??? src/
?   ??? app/              # Next.js App Router pages
?   ??? components/       # React components
?   ??? lib/              # Utility functions and configs
?   ??? hooks/            # Custom React hooks
??? prisma/               # Prisma schema and migrations
??? public/               # Static assets
??? scripts/              # Utility scripts
```

## Environment Variables

See `.env.example` for all required and optional environment variables.

## License

Private - All rights reserved
