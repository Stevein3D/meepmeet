-- Add placement and order to TablePlayer, migrate isWinner → placement=1
ALTER TABLE "TablePlayer" ADD COLUMN "placement" INTEGER;
ALTER TABLE "TablePlayer" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
UPDATE "TablePlayer" SET "placement" = 1 WHERE "isWinner" = true;
ALTER TABLE "TablePlayer" DROP COLUMN "isWinner";

-- Add order to EventRound, initialize from number
ALTER TABLE "EventRound" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
UPDATE "EventRound" SET "order" = "number";
