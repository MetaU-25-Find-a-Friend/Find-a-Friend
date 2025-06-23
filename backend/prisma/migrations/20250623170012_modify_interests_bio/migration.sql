/*
  Warnings:

  - The `interests` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `bio` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT NOT NULL,
DROP COLUMN "interests",
ADD COLUMN     "interests" INTEGER[];
