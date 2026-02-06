# Duplicate User Issue - Summary and Solutions

## The Problem

You have duplicate user records in your database due to a race condition in how users were created:

### Example of duplicates:
```
User 1:
- ID: cml9zgp8w0000ngdvxmfjkegv (Clerk ID)
- Email: john@example.com (REAL - from Clerk)
- Name: John Doe
- Status: Created by webhook ✓

User 2:
- ID: user_39IzvEfWS8AAGAfQYZF8gesIGpK (Clerk ID)
- Email: clerk-user_39IzvEfWS8AAGAfQYZF8gesIGpK@temp.local (PLACEHOLDER)
- Name: User
- Status: Created by API helper as placeholder
```

### Why this happened

The API helper was creating users with placeholder data before the webhook fired. If both occurred in quick succession, both records were created instead of just one being updated.

### Why you got the foreign key error

When you tried to delete users, events/games were still pointing to them:
- `Event_hostId_fkey` - Events reference the host user ID
- `UserGame_userId_fkey` - Game ownership references the user ID
- `EventAttendee_userId_fkey` - Event RSVPs reference the user ID

Database won't let you delete a user that still has relationships.

## How to Fix It

You have **two options**:

### Option 1: Automated Migration (Recommended)

Use the TypeScript migration script to automatically consolidate duplicates:

```bash
# Install ts-node if you don't have it
npm install -D ts-node

# Run the migration
npx ts-node scripts/migrate-duplicate-users.ts
```

**Advantages:**
- Automated, less error-prone
- Handles all relationships in correct order
- Shows detailed progress
- Can be run multiple times safely
- Works with both local SQLite and Neon PostgreSQL

**What it does:**
1. Finds all duplicate user groups
2. Identifies the "real" user (with actual email)
3. Migrates all relationships from placeholder to real user
4. Deletes the placeholder users

### Option 2: Manual SQL Cleanup

Use the SQL script to consolidate duplicates directly in Neon dashboard:

1. Open Neon dashboard → SQL Editor
2. Read the comments in `scripts/cleanup-duplicate-users.sql`
3. Run **STEP 1** first to identify duplicates
4. Run **STEP 2** to see the consolidation pairs
5. For each duplicate pair, modify and run **STEP 3** with correct IDs
6. Run **STEP 4** to verify no dangling foreign keys
7. Run **STEP 5** to delete remaining placeholder users

**Advantages:**
- Full control and visibility
- Can verify results after each step
- Good if you want to understand the process
- Can be done entirely in Neon dashboard

**Disadvantages:**
- More manual work
- Higher risk of mistakes if you use wrong IDs
- Need to repeat for each duplicate pair

## Prevention (Fixed)

The code has been updated to prevent this going forward:

1. **API Helper** (`src/lib/user-helper.ts`)
   - Now accepts optional Clerk user data
   - Creates users with real email, name, avatar when available
   - Only uses placeholders as fallback

2. **User Profile Endpoint** (`src/app/api/user/profile/route.ts`)
   - Extracts Clerk user data using `currentUser()`
   - Passes complete user info to helper
   - Ensures proper initialization

3. **Webhook** (`src/app/api/webhooks/clerk/route.ts`)
   - Changed from `create()` to `upsert()`
   - Handles race conditions gracefully
   - Updates existing records instead of failing

## Quick Start

### For automated fix (recommended):

```bash
# 1. Install ts-node
npm install -D ts-node

# 2. Backup your database first! (Neon: create a branch)
neon branch create --name backup-before-user-migration

# 3. Run the migration
npx ts-node scripts/migrate-duplicate-users.ts

# 4. Verify it worked
# - Check console output for success message
# - Count users: SELECT COUNT(*) FROM "User";
# - Check no dangling foreign keys (see MIGRATION_GUIDE.md)
```

### For manual SQL fix:

```
1. Go to Neon dashboard → SQL Editor
2. Open scripts/cleanup-duplicate-users.sql
3. Follow the step-by-step comments
4. Verify each step before proceeding
```

## Verification

After running either fix, verify it worked:

```sql
-- Should have no placeholder emails
SELECT COUNT(*) FROM "User" WHERE email LIKE 'clerk-%@temp.local';
-- Should return 0

-- Should have no dangling foreign keys
SELECT * FROM "Event" WHERE "hostId" NOT IN (SELECT id FROM "User");
-- Should return no rows

-- Should now be able to delete users
DELETE FROM "User" WHERE id = 'some_user_id';
-- Should work without foreign key errors
```

## Files Created

- `scripts/migrate-duplicate-users.ts` - Automated TypeScript migration
- `scripts/cleanup-duplicate-users.sql` - Manual SQL script
- `MIGRATION_GUIDE.md` - Detailed guide for running the migration

## Rollback

If something goes wrong:

**For Neon:**
```bash
# Switch back to your backup branch
neon branch checkout backup-before-user-migration
```

**For local SQLite:**
```bash
# Restore from backup
cp prisma/dev.db.backup prisma/dev.db
```

## Questions?

- Review `MIGRATION_GUIDE.md` for detailed instructions
- Check `scripts/cleanup-duplicate-users.sql` comments for understanding
- The migration script (`scripts/migrate-duplicate-users.ts`) has detailed logging
