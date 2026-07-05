-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "shardKey" TEXT;

-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "shardCount" INTEGER NOT NULL DEFAULT 1;
