-- AddColumn: score and isWinner to TablePlayer
ALTER TABLE "TablePlayer" ADD COLUMN "score" INTEGER;
ALTER TABLE "TablePlayer" ADD COLUMN "isWinner" BOOLEAN NOT NULL DEFAULT false;
