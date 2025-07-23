const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const { MESSAGES_PER_PAGE } = require("../constants");

// get messages between the logged-in user and the specified user
router.get("/:other/:cursor", async (req, res) => {
    const userId = req.session.userId;

    const otherId = parseInt(req.params.other);

    const cursor = parseInt(req.params.cursor);

    // if cursor is not provided, get the most recent 10 messages
    if (cursor === -1) {
        const messages = await prisma.message.findMany({
            take: MESSAGES_PER_PAGE,
            where: {
                OR: [
                    {
                        fromUser: userId,
                        toUser: otherId,
                    },
                    {
                        fromUser: otherId,
                        toUser: userId,
                    },
                ],
            },
            orderBy: {
                timestamp: "desc",
            },
        });

        // mark messages sent to the current user as read
        for (const id of messages
            .filter((element) => element.toUser === userId)
            .map((element) => element.id)) {
            await prisma.message.update({
                where: {
                    id: id,
                },
                data: {
                    read: true,
                },
            });
        }

        res.json(messages);
    } else {
        // if the id of the oldest already fetched message is given, take the first 10 messages before that
        const messages = await prisma.message.findMany({
            skip: 1,
            cursor: {
                id: cursor,
            },
            take: MESSAGES_PER_PAGE,
            where: {
                OR: [
                    {
                        fromUser: userId,
                        toUser: otherId,
                    },
                    {
                        fromUser: otherId,
                        toUser: userId,
                    },
                ],
            },
            orderBy: {
                timestamp: "desc",
            },
        });

        // mark messages sent to the current user as read
        for (const id of messages
            .filter((element) => element.toUser === userId)
            .map((element) => element.id)) {
            await prisma.message.update({
                where: {
                    id: id,
                },
                data: {
                    read: true,
                },
            });
        }

        res.json(messages);
    }
});

// send a message to the specified user
router.post("/:to", async (req, res) => {
    const from = req.session.userId;

    const to = parseInt(req.params.to);

    const { text } = req.body;

    if (!text) {
        return res.status(400).send("Message text is required");
    }

    const newMessage = await prisma.message.create({
        data: {
            fromUser: from,
            toUser: to,
            text: text,
            timestamp: new Date(),
        },
    });

    res.json(newMessage);
});

module.exports = router;
