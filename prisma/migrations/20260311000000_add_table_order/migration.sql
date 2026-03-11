-- Add order column to EventTable for drag-and-drop reordering
ALTER TABLE "EventTable" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
