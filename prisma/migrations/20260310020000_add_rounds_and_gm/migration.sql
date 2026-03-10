-- Truncate existing test data from EventTable and TablePlayer
-- (These tables were just created and have no real data worth preserving)
TRUNCATE TABLE "TablePlayer" CASCADE;
TRUNCATE TABLE "EventTable" CASCADE;

-- CreateTable EventRound
CREATE TABLE "EventRound" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex unique constraint on eventId + number
CREATE UNIQUE INDEX "EventRound_eventId_number_key" ON "EventRound"("eventId", "number");

-- AddForeignKey EventRound → Event
ALTER TABLE "EventRound" ADD CONSTRAINT "EventRound_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old eventId column from EventTable and add roundId
ALTER TABLE "EventTable" DROP COLUMN "eventId";
ALTER TABLE "EventTable" ADD COLUMN "roundId" TEXT NOT NULL DEFAULT '';

-- Remove the temporary default
ALTER TABLE "EventTable" ALTER COLUMN "roundId" DROP DEFAULT;

-- Drop old FK constraint on EventTable → Event (was added in previous migration)
ALTER TABLE "EventTable" DROP CONSTRAINT IF EXISTS "EventTable_eventId_fkey";

-- AddForeignKey EventTable → EventRound
ALTER TABLE "EventTable" ADD CONSTRAINT "EventTable_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EventRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add isGM column to TablePlayer
ALTER TABLE "TablePlayer" ADD COLUMN "isGM" BOOLEAN NOT NULL DEFAULT false;
