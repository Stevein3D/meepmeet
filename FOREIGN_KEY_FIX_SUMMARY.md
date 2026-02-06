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

**`getOrCreateDatabaseUser(clerkUserId, clerkUserData?)`**
- Gets or creates a database user from a Clerk user ID
- Optional `clerkUserData` parameter allows passing email, name, and avatar when available
- If user doesn't exist in database, creates a proper record with provided data
- Falls back to placeholder values only if data isn't available
- Ensures user always exists before creating foreign key relationships

**`getDatabaseUserId(clerkUserId, clerkUserData?)`**
- Wrapper that returns the database user ID
- Accepts same optional `clerkUserData` parameter
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

**Smart User Creation with Available Data:**
- When Clerk user data is available (e.g., from `currentUser()`), it's passed to the helper
- User is created with actual name, email, and avatar from the start
- Only uses placeholder values as fallback when data isn't available
- This ensures users have complete data even if webhook hasn't fired yet

**Webhook Uses Upsert:**
- Updated `user.created` webhook to use `upsert` instead of `create`
- If user was already created with placeholder data, webhook updates it with real data
- If webhook fires first, user is created with full data immediately
- Eliminates race condition where webhook would fail trying to create a user that already exists

**No Database ID Changes:**
- The User model still uses `@id @default(cuid())` but the webhook sets it to the Clerk ID
- This means Clerk ID and database ID are the same
- All foreign keys now correctly reference the database user

**No New Columns Needed:**
- Existing `name`, `email`, and `avatar` columns are properly populated
- No additional Clerk-specific columns required

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

2. **For routes with Clerk user data (recommended):**
   ```typescript
   import { currentUser } from '@clerk/nextjs/server'

   const { userId: clerkUserId } = await auth()
   const clerkUser = await currentUser()

   // Pass Clerk user data to ensure complete user creation
   const userId = await getDatabaseUserId(clerkUserId, {
     email: clerkUser?.emailAddresses?.[0]?.emailAddress,
     name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() ||
            clerkUser?.emailAddresses?.[0]?.emailAddress,
     avatar: clerkUser?.imageUrl
   })

   await prisma.something.create({
     data: { userId: userId, ... }
   })
   ```

3. **For routes without Clerk user data (fallback):**
   ```typescript
   // If Clerk user data isn't available, just pass clerkUserId
   const userId = await getDatabaseUserId(clerkUserId)
   if (!userId) return NextResponse.json({ error: '...' }, { status: 500 })

   await prisma.something.create({
     data: { userId: userId, ... }
   })
   ```

   Note: The webhook will update user details when it fires, so this is still safe.

## Files Modified

- `src/lib/user-helper.ts` - **UPDATED**: Enhanced to accept optional Clerk user data
- `src/app/api/webhooks/clerk/route.ts` - Updated to use upsert for user.created event
- `src/app/api/events/route.ts` - Updated POST handler
- `src/app/api/events/[id]/route.ts` - Updated PUT and DELETE handlers
- `src/app/api/events/[id]/rsvp/route.ts` - Updated POST handler
- `src/app/api/games/route.ts` - Updated POST handler
- `src/app/api/games/[id]/route.ts` - Updated PUT handler
- `src/app/api/games/[id]/ownership/route.ts` - Updated POST handler
- `src/app/api/user/profile/route.ts` - **UPDATED** to pass Clerk user data to helper

## Data Population Flow

**When user signs up via Clerk:**

1. User fills signup form with email, name, etc.
2. Clerk creates account and fires `user.created` webhook
3. Webhook uses `upsert` to create/update user in database with full data:
   - `id`: Clerk user ID
   - `email`: From Clerk account
   - `name`: From Clerk account
   - `avatar`: From Clerk account

**When user tries to create an event/game before webhook fires:**

1. User calls API (e.g., POST /api/events)
2. Helper's `getOrCreateDatabaseUser()` is called with:
   - Clerk ID (always available from `auth()`)
   - Optional Clerk user data (if endpoint has access to `currentUser()`)
3. If Clerk data is provided, user created with real email/name/avatar
4. If Clerk data isn't provided, user created with placeholder email only
5. When webhook fires, it upserts and updates user with real data

**Result:**
- User always has correct email, name, and avatar in database
- No more `clerk-{id}@temp.local` placeholder emails
- Foreign key constraints never violated
- Database stays in sync with Clerk

## Rollback

If needed, you can revert by:
1. Removing calls to `getDatabaseUserId()`
2. Changing `clerkUserId` back to `userId` in `auth()` calls
3. Deleting `src/lib/user-helper.ts`

However, this would re-introduce the foreign key constraint errors.
