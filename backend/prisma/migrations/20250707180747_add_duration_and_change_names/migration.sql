/*
  Warnings:

  - You are about to drop the `UserGeohashes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPastGeohashes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "UserGeohashes";

-- DropTable
DROP TABLE "UserPastGeohashes";

-- CreateTable
CREATE TABLE "UserGeohash" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "geohash" TEXT NOT NULL,

    CONSTRAINT "UserGeohash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPastGeohash" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "geohash" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "UserPastGeohash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGeohash_userId_key" ON "UserGeohash"("userId");
