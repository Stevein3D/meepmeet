-- Manual User Consolidation SQL Script
-- This script consolidates duplicate users by identifying pairs and migrating relationships
--
-- ⚠️  BACKUP YOUR DATABASE BEFORE RUNNING THIS!
--
-- Usage:
-- 1. Run each section separately (comments indicate what each does)
-- 2. Verify results after each step
-- 3. Stop if you see unexpected results and restore backup

-- ============================================================================
-- STEP 1: IDENTIFY DUPLICATES
-- ============================================================================
-- Run this first to see what duplicates exist
SELECT
  id,
  email,
  name,
  CASE
    WHEN email LIKE 'clerk-%@temp.local' THEN 'PLACEHOLDER'
    ELSE 'REAL'
  END as user_type,
  (SELECT COUNT(*) FROM "Event" WHERE "hostId" = u.id) as events_hosted,
  (SELECT COUNT(*) FROM "UserGame" WHERE "userId" = u.id) as games_owned,
  (SELECT COUNT(*) FROM "EventAttendee" WHERE "userId" = u.id) as event_rsvps
FROM "User" u
WHERE email LIKE 'clerk-%@temp.local' OR id LIKE 'user_%'
ORDER BY email;

-- ============================================================================
-- STEP 2: FIND PAIRS TO MERGE
-- ============================================================================
-- This shows which users should be consolidated together
-- The email with @temp.local should be merged INTO the real email
-- Example output:
--   Real user: 'cml9zgp8w0000ngdvxmfjkegv' with email 'john@example.com'
--   Duplicate: 'user_39IzvEfWS8AAGAfQYZF8gesIGpK' with email 'clerk-user_39IzvEfWS8AAGAfQYZF8gesIGpK@temp.local'

WITH placeholder_users AS (
  SELECT id, email, SUBSTRING(email FROM 7 FOR CHAR_LENGTH(email) - 18) as extracted_id
  FROM "User"
  WHERE email LIKE 'clerk-%@temp.local'
)
SELECT
  pu.id as placeholder_id,
  pu.email as placeholder_email,
  pu.extracted_id,
  ru.id as real_user_id,
  ru.email as real_email,
  ru.name as real_name
FROM placeholder_users pu
LEFT JOIN "User" ru ON ru.id = pu.extracted_id
ORDER BY ru.email;

-- ============================================================================
-- STEP 3: CONSOLIDATE ONE USER AT A TIME
-- ============================================================================
-- Replace 'user_39IzvEfWS8AAGAfQYZF8gesIGpK' with your placeholder user ID
-- Replace 'cml9zgp8w0000ngdvxmfjkegv' with the real user ID you want to keep

-- Example: DELETE FROM "User" WHERE id = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- But first, migrate all relationships:

BEGIN;

-- Define the IDs (CHANGE THESE VALUES!)
-- OLD_USER_ID should be the placeholder user you want to DELETE
-- NEW_USER_ID should be the real user you want to KEEP
-- You can find these from STEP 2 above

-- Placeholder: Update all events hosted by old user to new user
UPDATE "Event" SET "hostId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "hostId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Placeholder: Update all game ownership from old user to new user
UPDATE "UserGame" SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND NOT EXISTS (
  SELECT 1 FROM "UserGame" ug2
  WHERE ug2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ug2."gameId" = "UserGame"."gameId"
);

-- Placeholder: Update all event RSVPs from old user to new user
UPDATE "EventAttendee" SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND NOT EXISTS (
  SELECT 1 FROM "EventAttendee" ea2
  WHERE ea2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ea2."eventId" = "EventAttendee"."eventId"
);

-- Placeholder: Update play session winners from old user to new user
UPDATE "PlaySession" SET "winnerId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "winnerId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Placeholder: Update session players from old user to new user
UPDATE "SessionPlayer" SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND NOT EXISTS (
  SELECT 1 FROM "SessionPlayer" sp2
  WHERE sp2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND sp2."sessionId" = "SessionPlayer"."sessionId"
);

-- Now delete the old user
DELETE FROM "User" WHERE id = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

COMMIT;

-- ============================================================================
-- STEP 4: VERIFY CONSOLIDATION
-- ============================================================================
-- After running STEP 3, verify no dangling foreign keys exist:

SELECT 'Events with missing host' as check_name
FROM "Event"
WHERE "hostId" NOT IN (SELECT id FROM "User")
UNION ALL
SELECT 'UserGames with missing user'
FROM "UserGame"
WHERE "userId" NOT IN (SELECT id FROM "User")
UNION ALL
SELECT 'EventAttendees with missing user'
FROM "EventAttendee"
WHERE "userId" NOT IN (SELECT id FROM "User")
UNION ALL
SELECT 'SessionPlayers with missing user'
FROM "SessionPlayer"
WHERE "userId" NOT IN (SELECT id FROM "User")
UNION ALL
SELECT 'PlaySessions with missing winner'
FROM "PlaySession"
WHERE "winnerId" IS NOT NULL
AND "winnerId" NOT IN (SELECT id FROM "User");

-- ============================================================================
-- STEP 5: DELETE REMAINING PLACEHOLDER USERS
-- ============================================================================
-- After consolidating all users, delete any remaining placeholder users:

DELETE FROM "User"
WHERE email LIKE 'clerk-%@temp.local';

-- Verify deletion
SELECT COUNT(*) as remaining_placeholder_users
FROM "User"
WHERE email LIKE 'clerk-%@temp.local';

-- Should return 0
