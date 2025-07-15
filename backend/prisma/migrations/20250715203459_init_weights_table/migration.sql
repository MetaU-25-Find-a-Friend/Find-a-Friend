-- CreateTable
CREATE TABLE "PlaceRecommendationWeights" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "friendWeight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "pastVisitWeight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "countWeight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "similarityWeight" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "distanceWeight" DECIMAL(65,30) NOT NULL DEFAULT 1,

    CONSTRAINT "PlaceRecommendationWeights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceRecommendationWeights_userId_key" ON "PlaceRecommendationWeights"("userId");
