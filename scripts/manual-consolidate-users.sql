-- Manual User Consolidation for Duplicate Placeholder Users
-- ⚠️ BACKUP YOUR DATABASE BEFORE RUNNING THIS!
--
-- This script handles the case where you have:
-- 1. A "real" user with actual email and avatar (created with database CUID)
-- 2. Multiple "placeholder" users with clerk-{id}@temp.local emails (created by API helper)
--
-- We'll consolidate everything to the real user and delete the placeholders

BEGIN;

-- Step 1: Identify the consolidation
-- Real user: cml9zgp8w0000ngdvxmfjkegv (email: stevein3d@gmail.com)
-- Placeholder users:
-- - user_39EPuiBWcAQAil5UTNJfVCPDamT
-- - user_39IzvEfWS8AAGAfQYZF8gesIGpK

-- Step 2: Migrate all relationships from placeholder users to real user

-- Migrate events hosted by placeholder user 1
UPDATE "Event"
SET "hostId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "hostId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT';

-- Migrate events hosted by placeholder user 2
UPDATE "Event"
SET "hostId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "hostId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Migrate game ownership from placeholder user 1 (delete duplicates first)
DELETE FROM "UserGame"
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT'
AND EXISTS (
  SELECT 1 FROM "UserGame" ug2
  WHERE ug2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ug2."gameId" = "UserGame"."gameId"
);

-- Update remaining game ownership from placeholder user 1
UPDATE "UserGame"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT';

-- Migrate game ownership from placeholder user 2 (delete duplicates first)
DELETE FROM "UserGame"
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND EXISTS (
  SELECT 1 FROM "UserGame" ug2
  WHERE ug2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ug2."gameId" = "UserGame"."gameId"
);

-- Update remaining game ownership from placeholder user 2
UPDATE "UserGame"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Migrate event RSVPs from placeholder user 1 (delete duplicates first)
DELETE FROM "EventAttendee"
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT'
AND EXISTS (
  SELECT 1 FROM "EventAttendee" ea2
  WHERE ea2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ea2."eventId" = "EventAttendee"."eventId"
);

-- Update remaining event RSVPs from placeholder user 1
UPDATE "EventAttendee"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT';

-- Migrate event RSVPs from placeholder user 2 (delete duplicates first)
DELETE FROM "EventAttendee"
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND EXISTS (
  SELECT 1 FROM "EventAttendee" ea2
  WHERE ea2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND ea2."eventId" = "EventAttendee"."eventId"
);

-- Update remaining event RSVPs from placeholder user 2
UPDATE "EventAttendee"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Migrate play session winners from placeholder users
UPDATE "PlaySession"
SET "winnerId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "winnerId" IN ('user_39EPuiBWcAQAil5UTNJfVCPDamT', 'user_39IzvEfWS8AAGAfQYZF8gesIGpK');

-- Migrate session players from placeholder user 1 (delete duplicates first)
DELETE FROM "SessionPlayer"
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT'
AND EXISTS (
  SELECT 1 FROM "SessionPlayer" sp2
  WHERE sp2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND sp2."sessionId" = "SessionPlayer"."sessionId"
);

-- Update remaining session players from placeholder user 1
UPDATE "SessionPlayer"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT';

-- Migrate session players from placeholder user 2 (delete duplicates first)
DELETE FROM "SessionPlayer"
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK'
AND EXISTS (
  SELECT 1 FROM "SessionPlayer" sp2
  WHERE sp2."userId" = 'cml9zgp8w0000ngdvxmfjkegv'
  AND sp2."sessionId" = "SessionPlayer"."sessionId"
);

-- Update remaining session players from placeholder user 2
UPDATE "SessionPlayer"
SET "userId" = 'cml9zgp8w0000ngdvxmfjkegv'
WHERE "userId" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Step 3: Delete the placeholder users
DELETE FROM "User" WHERE "id" = 'user_39EPuiBWcAQAil5UTNJfVCPDamT';
DELETE FROM "User" WHERE "id" = 'user_39IzvEfWS8AAGAfQYZF8gesIGpK';

-- Step 4: Verify no dangling foreign keys
SELECT 'Events with missing host' as issue
FROM "Event"
WHERE "hostId" NOT IN (SELECT id FROM "User")
LIMIT 1

UNION ALL

SELECT 'UserGames with missing user'
FROM "UserGame"
WHERE "userId" NOT IN (SELECT id FROM "User")
LIMIT 1

UNION ALL

SELECT 'EventAttendees with missing user'
FROM "EventAttendee"
WHERE "userId" NOT IN (SELECT id FROM "User")
LIMIT 1

UNION ALL

SELECT 'SessionPlayers with missing user'
FROM "SessionPlayer"
WHERE "userId" NOT IN (SELECT id FROM "User")
LIMIT 1

UNION ALL

SELECT 'PlaySessions with missing winner'
FROM "PlaySession"
WHERE "winnerId" IS NOT NULL
AND "winnerId" NOT IN (SELECT id FROM "User")
LIMIT 1;

-- If the above query returns no rows, consolidation was successful!

COMMIT;
