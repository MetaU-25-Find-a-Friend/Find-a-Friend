-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" SERIAL NOT NULL,
    "fromUser" INTEGER NOT NULL,
    "toUser" INTEGER NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);
