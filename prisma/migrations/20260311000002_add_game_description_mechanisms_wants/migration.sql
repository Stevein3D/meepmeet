-- Add description and mechanisms to Game
ALTER TABLE "Game" ADD COLUMN "description" TEXT;
ALTER TABLE "Game" ADD COLUMN "mechanisms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Create UserGameWant table
CREATE TABLE "UserGameWant" (
  "userId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  CONSTRAINT "UserGameWant_pkey" PRIMARY KEY ("userId","gameId"),
  CONSTRAINT "UserGameWant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserGameWant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
