-- Add dateConfirmed to Event
ALTER TABLE "Event" ADD COLUMN "dateConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- EventDatePoll
CREATE TABLE "EventDatePoll" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "confirmedAt" TIMESTAMP(3),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventDatePoll_eventId_date_key" ON "EventDatePoll"("eventId", "date");

ALTER TABLE "EventDatePoll" ADD CONSTRAINT "EventDatePoll_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventDateVote
CREATE TABLE "EventDateVote" (
  "optionId" TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  PRIMARY KEY ("optionId", "userId")
);

ALTER TABLE "EventDateVote" ADD CONSTRAINT "EventDateVote_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "EventDatePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventDateVote" ADD CONSTRAINT "EventDateVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventGuest
CREATE TABLE "EventGuest" (
  "id"        TEXT NOT NULL,
  "eventId"   TEXT NOT NULL,
  "bringerId" TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  PRIMARY KEY ("id")
);

ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_bringerId_fkey"
  FOREIGN KEY ("bringerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
