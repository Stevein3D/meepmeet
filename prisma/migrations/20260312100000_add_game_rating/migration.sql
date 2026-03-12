CREATE TABLE "GameRating" (
  "userId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameRating_pkey" PRIMARY KEY ("userId","gameId")
);

ALTER TABLE "GameRating" ADD CONSTRAINT "GameRating_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameRating" ADD CONSTRAINT "GameRating_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
