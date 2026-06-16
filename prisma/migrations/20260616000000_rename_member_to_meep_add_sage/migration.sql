-- Rename MEMBER -> MEEP (preserves all existing rows; metadata-only) and add SAGE
ALTER TYPE "UserRole" RENAME VALUE 'MEMBER' TO 'MEEP';
ALTER TYPE "UserRole" ADD VALUE 'SAGE' BEFORE 'GAME_MASTER';
