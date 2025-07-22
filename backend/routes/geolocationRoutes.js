const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// update the logged-in user's location
router.post("/", async (req, res) => {
    const userId = req.session.userId;

    const hash = req.body.geohash;

    if (!hash) {
        return res.status(400).send("Geohash is required");
    }

    await prisma.userGeohash.upsert({
        create: {
            userId: userId,
            geohash: hash,
        },
        update: {
            geohash: hash,
        },
        where: {
            userId: userId,
        },
    });

    res.send("Location updated");
});

// remove the logged-in user's location data from the database
router.delete("/", async (req, res) => {
    const userId = req.session.userId;
    try {
        await prisma.userGeohash.delete({
            where: {
                userId: userId,
            },
        });

        res.send("Successfully deleted");
    } catch (error) {
        res.status(404).send("Geohash record not found");
    }
});

// gets ids and locations of active users other than the logged-in user
router.get("/active/other", async (req, res) => {
    const userId = req.session.userId;

    const locations = await prisma.userGeohash.findMany({
        where: {
            NOT: {
                userId: userId,
            },
        },
    });

    const result = Array();

    // if the user at a location has blocked the current user, don't include them
    for (const location of locations) {
        const { blockedUsers } = await prisma.user.findUnique({
            where: {
                id: location.userId,
            },
        });

        if (!blockedUsers.includes(userId)) {
            result.push(location);
        }
    }

    res.json(result);
});

// add a new record to user's past locations or increment duration at location
router.post("/history", async (req, res) => {
    const userId = req.session.userId;

    const hash = req.body.geohash;

    if (!hash) {
        return res.status(400).send("Geohash is required");
    }

    // find most recent past location, if the user has one
    const lastRecorded = await prisma.userPastGeohash.findFirst({
        orderBy: {
            timestamp: "desc",
        },
        where: {
            userId: userId,
        },
    });

    if (lastRecorded) {
        // calculate time since the most recent record was updated
        const timeSinceLastRecorded =
            new Date().valueOf() -
            (lastRecorded.timestamp.valueOf() + lastRecorded.duration);

        // if the user is at the same location and it hasn't been a significant amount of time, add to duration instead of adding a new record
        if (
            timeSinceLastRecorded <= TIME_STILL_AT_LOCATION &&
            lastRecorded.geohash.startsWith(hash.slice(0, GEOHASH_DUP_RES))
        ) {
            await prisma.userPastGeohash.update({
                data: {
                    duration: {
                        increment: timeSinceLastRecorded,
                    },
                },
                where: {
                    id: lastRecorded.id,
                },
            });

            return res.status(200).send("Duration updated");
        }
    }

    // otherwise, create a new record
    await prisma.userPastGeohash.create({
        data: {
            userId: userId,
            timestamp: new Date(),
            geohash: hash,
            duration: INITIAL_DURATION,
        },
    });

    res.status(201).send("New visit recorded");
});

// get all of user's past locations
router.get("/history", async (req, res) => {
    const userId = req.session.userId;

    const history = await prisma.userPastGeohash.findMany({
        where: {
            userId: userId,
        },
    });

    res.json(history);
});

module.exports = router;
