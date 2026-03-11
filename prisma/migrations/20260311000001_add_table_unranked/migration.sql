-- Add unranked flag to EventTable for opting out of MMR tracking
ALTER TABLE "EventTable" ADD COLUMN "unranked" BOOLEAN NOT NULL DEFAULT false;
