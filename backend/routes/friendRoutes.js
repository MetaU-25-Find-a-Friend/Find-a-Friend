const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// create a friend request from the logged-in user to another user
router.post("/:to", async (req, res) => {
    const from = req.session.userId;

    const to = parseInt(req.params.to);

    // check whether an active friend request exists between them or they are already friends
    const duplicateExists =
        (await prisma.friendRequest.count({
            where: {
                AND: [
                    {
                        OR: [
                            {
                                fromUser: from,
                                toUser: to,
                            },
                            {
                                fromUser: to,
                                toUser: from,
                            },
                        ],
                    },
                    {
                        acceptedAt: null,
                    },
                ],
            },
        })) > 0;

    const userFromFriends = await prisma.user.findUnique({
        where: {
            id: from,
        },
        select: {
            friends: true,
        },
    });

    const alreadyFriends = userFromFriends.friends.includes(to);

    if (duplicateExists || alreadyFriends) {
        return res
            .status(409)
            .send(
                "A friend request or relation between these users already exists",
            );
    }

    await prisma.friendRequest.create({
        data: {
            fromUser: from,
            toUser: to,
        },
    });

    res.status(201).send("Friend request sent");
});

// get all active friend requests to the logged-in user
router.get("/", async (req, res) => {
    const userId = req.session.userId;

    const requests = await prisma.friendRequest.findMany({
        where: {
            toUser: userId,
            acceptedAt: null,
        },
    });

    res.json(requests);
});

// accept the friend request from the specified user to the logged-in user and make them friends
router.post("/accept/:from", async (req, res) => {
    const to = req.session.userId;

    const from = parseInt(req.params.from);

    const friendRequest = await prisma.friendRequest.findFirst({
        where: {
            fromUser: from,
            toUser: to,
        },
        select: {
            id: true,
        },
    });

    if (!friendRequest) {
        return res.status(404).send("Request not found");
    }

    // make the two users friends
    await prisma.user.update({
        where: {
            id: from,
        },
        data: {
            friends: {
                push: to,
            },
        },
    });

    await prisma.user.update({
        where: {
            id: to,
        },
        data: {
            friends: {
                push: from,
            },
        },
    });

    // mark the current time as the start of the friendship
    await prisma.friendRequest.update({
        where: {
            id: friendRequest.id,
        },
        data: {
            acceptedAt: new Date(),
        },
    });

    res.send("Request accepted");
});

// delete the friend request from the specified user to the logged-in user
router.post("/decline/:from", async (req, res) => {
    const to = req.session.userId;

    const from = parseInt(req.params.from);

    const friendRequest = await prisma.friendRequest.findFirst({
        where: {
            fromUser: from,
            toUser: to,
        },
        select: {
            id: true,
        },
    });

    if (!friendRequest) {
        return res.status(404).send("Request not found");
    }

    await prisma.friendRequest.delete({
        where: {
            id: friendRequest.id,
        },
    });

    res.send("Request declined");
});

// get duration in ms that users have been friends
router.get("/duration/:one/:other", async (req, res) => {
    const oneId = parseInt(req.params.one);

    const otherId = parseInt(req.params.other);

    const friendRequest = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                {
                    fromUser: oneId,
                    toUser: otherId,
                },
                {
                    fromUser: otherId,
                    toUser: oneId,
                },
            ],
        },
    });

    if (!friendRequest || !friendRequest.acceptedAt) {
        return res.status(400).send("The users are not friends");
    }

    const duration = new Date() - friendRequest.acceptedAt;

    res.json({
        duration: duration,
    });
});

module.exports = router;
