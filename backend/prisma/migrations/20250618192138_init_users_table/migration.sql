-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "pronouns" TEXT,
    "age" INTEGER,
    "major" TEXT,
    "interests" TEXT,
    "allowsLocation" BOOLEAN NOT NULL,
    "blockedUsers" INTEGER[],
    "friends" INTEGER[],
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
