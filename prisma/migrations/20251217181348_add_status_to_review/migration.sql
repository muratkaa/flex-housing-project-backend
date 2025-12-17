/*
  Warnings:

  - Made the column `listingName` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `guestName` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rating` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `channel` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "status" TEXT,
ALTER COLUMN "listingName" SET NOT NULL,
ALTER COLUMN "guestName" SET NOT NULL,
ALTER COLUMN "rating" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "channel" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;
