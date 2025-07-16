-- AlterTable
ALTER TABLE "PlaceRecommendationWeights" ADD COLUMN     "likedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "typeWeight" DECIMAL(65,30) NOT NULL DEFAULT 1;
