# Foreign Key Constraint Fix - Summary

## Problem
The API routes were using Clerk user IDs directly as foreign keys without ensuring the corresponding database user existed first. This caused foreign key constraint violations in production:
- `Event_hostId_fkey` violations when creating events
- `UserGame_userId_fkey` violations when creating/updating games and ownership records
- `EventAttendee_userId_fkey` violations when RSVPing to events

## Root Cause
The Clerk webhook creates users with their Clerk ID as the primary key, but:
1. The webhook might fire asynchronously, creating race conditions
2. API routes were using Clerk IDs directly without verifying the database user existed first
3. The User schema expects the ID to be the Clerk ID (based on the webhook implementation), but wasn't being enforced in all APIs

## Solution Implemented

### 1. Created User Helper (`src/lib/user-helper.ts`)
A new utility module with two key functions:

**`getOrCreateDatabaseUser(clerkUserId)`**
- Gets or creates a database user from a Clerk user ID
- If user doesn't exist in database, creates a placeholder record
- The webhook will later update it with full details (name, email, avatar)
- Ensures user always exists before creating foreign key relationships

**`getDatabaseUserId(clerkUserId)`**
- Wrapper that returns the database user ID
- Returns the same ID since Clerk ID is used as primary key
- Ensures user exists before returning the ID

### 2. Updated API Routes

All routes that create foreign key relationships now:
1. Rename `userId` from `auth()` to `clerkUserId`
2. Call `getDatabaseUserId(clerkUserId)` to ensure user exists
3. Use the returned `userId` for all database operations
4. Return proper error messages if user creation fails

#### Updated Routes:

**Events:**
- `src/app/api/events/route.ts` - POST (create event)
- `src/app/api/events/[id]/route.ts` - PUT (update event), DELETE (delete event)
- `src/app/api/events/[id]/rsvp/route.ts` - POST (RSVP to event)

**Games:**
- `src/app/api/games/route.ts` - POST (create game)
- `src/app/api/games/[id]/route.ts` - PUT (update game and ownership)
- `src/app/api/games/[id]/ownership/route.ts` - POST (toggle ownership)

**User:**
- `src/app/api/user/profile/route.ts` - GET (fetch user profile)
  - Now uses `getDatabaseUserId()` instead of searching by email
  - Ensures consistency with webhook-created users

### 3. Key Design Decisions

**Automatic User Creation:**
- Rather than failing if a user doesn't exist, the helper creates a placeholder
- This prevents race conditions with the webhook
- Email field uses temporary value: `clerk-{clerkUserId}@temp.local`
- The webhook will update name, email, and avatar when it fires

**No Database ID Changes:**
- The User model still uses `@id @default(cuid())` but the webhook sets it to the Clerk ID
- This means Clerk ID and database ID are the same
- All foreign keys now correctly reference the database user

**Backward Compatibility:**
- Works with both SQLite (local) and PostgreSQL (production)
- No schema changes required
- Existing foreign key relationships continue to work

## Testing Checklist

- [ ] Create event - should work even if webhook hasn't fired yet
- [ ] RSVP to event - should work even if webhook hasn't fired yet
- [ ] Create game - should work even if webhook hasn't fired yet
- [ ] Toggle game ownership - should work even if webhook hasn't fired yet
- [ ] Edit event - should work and preserve host relationship
- [ ] Edit game - should work and preserve ownership relationship
- [ ] Delete event - should work with cascade delete
- [ ] Delete game - should work with cascade delete
- [ ] Check database - user records should be created with Clerk ID as primary key
- [ ] Check production logs - no foreign key constraint errors

## Migration Notes

If you have existing code that also uses Clerk IDs directly for database operations:

1. **Import the helper:**
   ```typescript
   import { getDatabaseUserId } from '@/lib/user-helper'
   ```

2. **Update your code:**
   ```typescript
   // Before
   const { userId } = await auth()
   await prisma.something.create({
     data: { userId: userId, ... }
   })

   // After
   const { userId: clerkUserId } = await auth()
   const userId = await getDatabaseUserId(clerkUserId)
   if (!userId) return NextResponse.json({ error: '...' }, { status: 500 })
   await prisma.something.create({
     data: { userId: userId, ... }
   })
   ```

## Files Modified

- `src/lib/user-helper.ts` - **NEW**: User lookup/creation helper
- `src/app/api/events/route.ts` - Updated POST handler
- `src/app/api/events/[id]/route.ts` - Updated PUT and DELETE handlers
- `src/app/api/events/[id]/rsvp/route.ts` - Updated POST handler
- `src/app/api/games/route.ts` - Updated POST handler
- `src/app/api/games/[id]/route.ts` - Updated PUT handler
- `src/app/api/games/[id]/ownership/route.ts` - Updated POST handler
- `src/app/api/user/profile/route.ts` - Updated GET handler

## Rollback

If needed, you can revert by:
1. Removing calls to `getDatabaseUserId()`
2. Changing `clerkUserId` back to `userId` in `auth()` calls
3. Deleting `src/lib/user-helper.ts`

However, this would re-introduce the foreign key constraint errors.
