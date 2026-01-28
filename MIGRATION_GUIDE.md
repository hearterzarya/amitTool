# Database Migration Guide

## Common Migration Issues

### Issue 1: Shadow Database Error (P3006)

If you see:
```
Error: P3006
Migration `add_nextauth_models` failed to apply cleanly to the shadow database.
Error: The underlying table for model `users` does not exist.
```

This happens when migrations are out of order or the database is in an inconsistent state.

**Quick Fix (Recommended for Development):**

Use `db push` to sync your schema directly without migration history:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema directly (creates/updates all tables)
npx prisma db push
```

**Alternative Solutions:**

1. **Reset and recreate everything (Development only - deletes all data):**
```bash
npx prisma migrate reset
```

2. **Mark migration as applied (if database already has the tables):**
```bash
npx prisma migrate resolve --applied add_nextauth_models
npx prisma migrate dev
```

3. **Disable shadow database (not recommended):**
Add to `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Optional: use separate shadow DB
}
```

### Issue 2: Missing Database Columns

If you see errors like:
```
The column `payments.couponId` does not exist in the current database.
The column `tools.sharedPlanPrice1Month` does not exist in the current database.
```

This means your database schema is out of sync with the Prisma schema.

## Solution

### Option 1: Create New Migration (Recommended for Production)

This creates a migration file that you can review and apply:

```bash
# Generate Prisma Client first
npm run db:generate

# Create and apply migration
npx prisma migrate dev --name add_missing_columns
```

### Option 2: Push Schema Directly (Development Only)

If you're in development and don't need to preserve data:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes directly (WARNING: May cause data loss)
npx prisma db push
```

### Option 3: Reset Database (Development Only - Deletes All Data)

**⚠️ WARNING: This will delete all data in your database!**

```bash
# Reset database and apply all migrations
npx prisma migrate reset
```

## What Columns Are Missing?

Based on the Prisma schema, these columns should exist:

### Payments Table
- `couponId` (String, nullable) - Reference to applied coupon

### Tools Table
- `sharedPlanPrice1Month` (BigInt, nullable)
- `sharedPlanPrice3Months` (BigInt, nullable)
- `sharedPlanPrice6Months` (BigInt, nullable)
- `sharedPlanPrice1Year` (BigInt, nullable)
- `privatePlanPrice1Month` (BigInt, nullable)
- `privatePlanPrice3Months` (BigInt, nullable)
- `privatePlanPrice6Months` (BigInt, nullable)
- `privatePlanPrice1Year` (BigInt, nullable)

## After Migration

1. Verify the migration was successful:
```bash
npx prisma studio
```

2. Check that your app builds:
```bash
npm run build
```

3. Start the dev server:
```bash
npm run dev
```

## Troubleshooting

### Migration Fails with "Column already exists"
- Your database may already have some columns
- Use `npx prisma db pull` to sync your Prisma schema with the actual database
- Then create a new migration for any remaining differences

### Migration Fails with Foreign Key Errors
- Ensure all referenced tables exist
- Check that foreign key constraints are properly defined in the schema

### Need to Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>
```
