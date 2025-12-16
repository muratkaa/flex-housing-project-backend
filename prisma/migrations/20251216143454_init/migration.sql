-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "hostawayId" INTEGER NOT NULL,
    "listingName" TEXT,
    "guestName" TEXT,
    "rating" DOUBLE PRECISION,
    "content" TEXT,
    "channel" TEXT,
    "type" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "categories" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_hostawayId_key" ON "Review"("hostawayId");
