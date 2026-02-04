-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VISITOR', 'MEMBER', 'GAME_MASTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VISITOR';
