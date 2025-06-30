-- CreateTable
CREATE TABLE "UserPastGeohashes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "geohash" TEXT NOT NULL,

    CONSTRAINT "UserPastGeohashes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPastGeohashes_userId_key" ON "UserPastGeohashes"("userId");
