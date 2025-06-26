-- CreateTable
CREATE TABLE "UserGeohashes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "geohash" TEXT NOT NULL,

    CONSTRAINT "UserGeohashes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGeohashes_userId_key" ON "UserGeohashes"("userId");
