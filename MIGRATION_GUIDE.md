# Duplicate User Migration Guide

## Problem

You have duplicate user records in your database:
- Some users exist with their actual email address (created by the webhook)
- Some users exist with placeholder Clerk emails like `clerk-{id}@temp.local` (created by the API helper)
- Events and games reference these duplicate records, causing foreign key constraint violations

## Solution

Run the migration script to consolidate all duplicate users into their "real" record (the one with actual email).

## Prerequisites

Make sure you have `ts-node` installed:

```bash
npm install -D ts-node
```

## Running the Migration

### Option 1: Using ts-node directly (Recommended)

```bash
npx ts-node scripts/migrate-duplicate-users.ts
```

### Option 2: Using Node with tsx

```bash
npx tsx scripts/migrate-duplicate-users.ts
```

### Option 3: Convert to JavaScript first

If you have issues with TypeScript, you can convert the script:

```bash
npx ts-node --transpile-only scripts/migrate-duplicate-users.ts
```

## What the Migration Does

1. **Identifies duplicates** - Finds users with the same Clerk ID but different database IDs
2. **Selects the real user** - Picks the user with the actual email (not placeholder)
3. **Migrates relationships** - Updates all foreign keys from placeholder users to real user:
   - Events hosted
   - Games owned
   - Event RSVPs
   - Play session wins
4. **Deletes placeholders** - Removes the duplicate placeholder user records

## Before Running

**Backup your database!** This is a destructive operation.

For Neon:
```bash
# Create a branch before running the migration
neon branch create --name backup-before-user-migration
```

For local SQLite:
```bash
cp prisma/dev.db prisma/dev.db.backup
```

## After Running

### Verify the migration worked:

1. Check user count decreased:
```sql
SELECT COUNT(*) FROM "User";
```

2. Check no dangling foreign keys:
```sql
SELECT * FROM "Event" WHERE "hostId" NOT IN (SELECT "id" FROM "User");
SELECT * FROM "UserGame" WHERE "userId" NOT IN (SELECT "id" FROM "User");
SELECT * FROM "EventAttendee" WHERE "userId" NOT IN (SELECT "id" FROM "User");
```

3. Verify you can delete users now (if needed):
```sql
DELETE FROM "User" WHERE id = 'user_xxxxx';
```

## Troubleshooting

### "Error: Cannot find module ts-node"

Install it globally or locally:
```bash
npm install -D ts-node typescript
```

### Migration fails partway through

The script uses Prisma transactions where possible. If it fails:
1. Check the error message
2. Fix any data inconsistencies manually
3. Re-run the script (it's idempotent - safe to run multiple times)

### Script hangs or times out

The migration might be taking longer than expected for large datasets:
```bash
# Run with a longer timeout
npx ts-node --max-old-space-size=4096 scripts/migrate-duplicate-users.ts
```

## Preventing Future Duplicates

The updated code now:
1. **API helper** - Creates users with real Clerk data when available
2. **Webhook** - Uses `upsert` instead of `create` to handle race conditions
3. **User profile endpoint** - Passes Clerk data to ensure complete initialization

No more duplicate users will be created going forward!

## Manual Cleanup (if needed)

If you want to manually delete users after consolidation:

```sql
-- Find users with placeholder emails
SELECT id, email, name FROM "User" WHERE email LIKE 'clerk-%@temp.local';

-- Delete them (after confirming they have no relationships)
DELETE FROM "User" WHERE id = 'user_xxxxx';
```

## Restoring from Backup (if something goes wrong)

For Neon:
```bash
# Switch back to your backup branch
neon branch checkout backup-before-user-migration
```

For local SQLite:
```bash
cp prisma/dev.db.backup prisma/dev.db
```

Then run the migration again after investigating what went wrong.
