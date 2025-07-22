const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// get the user's saved recommendation weights or create a new record with the default weights
router.get("/", async (req, res) => {
    const userId = req.session.userId;

    const weights = await prisma.placeRecommendationWeights.findUnique({
        where: {
            userId: userId,
        },
    });

    if (weights) {
        return res.json(weights);
    }

    const newWeights = await prisma.placeRecommendationWeights.create({
        data: {
            userId: userId,
        },
    });

    return res.json(newWeights);
});

// update the recommendation weights for the logged-in user
router.post("/", async (req, res) => {
    const userId = req.session.userId;

    if (
        !req.body.friendAdjustment &&
        !req.body.pastVisitAdjustment &&
        !req.body.countAdjustment &&
        !req.body.similarityAdjustment &&
        !req.body.distanceAdjustment &&
        !req.body.typeAdjustment
    ) {
        return res
            .status(400)
            .send("At least one adjustment value must be provided");
    }

    await prisma.placeRecommendationWeights.update({
        where: {
            userId: userId,
        },
        data: {
            friendWeight: {
                increment: req.body.friendAdjustment ?? 0,
            },
            pastVisitWeight: {
                increment: req.body.pastVisitAdjustment ?? 0,
            },
            countWeight: {
                increment: req.body.countAdjustment ?? 0,
            },
            similarityWeight: {
                increment: req.body.similarityAdjustment ?? 0,
            },
            distanceWeight: {
                increment: req.body.distanceAdjustment ?? 0,
            },
            typeWeight: {
                increment: req.body.typeAdjustment ?? 0,
            },
        },
    });

    res.status(200).send("Weights updated");
});

// add a place type to the user's liked types
router.post("/types/:newType", async (req, res) => {
    const userId = req.session.userId;

    const newType = req.params.newType;

    const existing = await prisma.placeRecommendationWeights.findUnique({
        where: {
            userId: userId,
        },
        select: {
            likedTypes: true,
        },
    });

    if (!existing) {
        return res
            .status(404)
            .send("Weights for user have not yet been initialized");
    }

    if (existing.likedTypes.includes(newType)) {
        return res.status(409).send("Type already liked");
    }

    await prisma.placeRecommendationWeights.update({
        where: {
            userId: userId,
        },
        data: {
            likedTypes: {
                push: req.params.newType,
            },
        },
    });

    res.status(200).send("Types updated");
});

module.exports = router;
