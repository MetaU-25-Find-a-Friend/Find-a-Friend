const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
    },
});

const crypto = require("crypto");
const bcrypt = require("bcrypt");

// get a user's profile
router.get("/:id", async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            firstName: true,
            lastName: true,
            pronouns: true,
            year: true,
            major: true,
            interests: true,
            bio: true,
        },
    });

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.json(user);
});

// get a user's full data
router.get("/details/:id", async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.json(user);
});

// update the logged-in user's profile
router.post("/", async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...req.body,
            },
        });

        res.json(user);
    } catch (error) {
        res.status(404).send("User not found");
    }
});

// send email with code to reset user's password
router.post("/resetPassword/generate", async (req, res) => {
    const userId = req.session.userId;

    // verify email connection
    try {
        await transporter.verify();
    } catch (error) {
        return res
            .status(500)
            .send(`Error connecting to SMTP server: ${error}`);
    }

    // generate code and store in database
    const token = crypto.randomBytes(32).toString("hex");
    const encryptedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 60 * 1000);
    await prisma.passwordResetToken.upsert({
        where: {
            userId: userId,
        },
        create: {
            userId: userId,
            token: encryptedToken,
            expiresAt: expiresAt,
        },
        update: {
            token: encryptedToken,
            expiresAt: expiresAt,
        },
    });

    // build link using code
    const link = `${process.env.FRONTEND_URL}/resetpassword?token=${token}`;

    // send email with code
    const { email } = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            email: true,
        },
    });

    try {
        await transporter.sendMail({
            from: {
                name: "Find a Friend",
                address: process.env.SMTP_FROM,
            },
            to: email,
            subject: "Reset your Find a Friend account password",
            text: `Click to enter a new password for your Find a Friend account: ${link}`,
            html: `<h4>Click below to enter a new password for your Find a Friend account:</h4><b><a href=${link}>Reset Password</a></b><p>- the Find a Friend team</p>`,
        });
    } catch (error) {
        return res.status(500).send(`Error sending mail: ${error}`);
    }

    res.send("Email sent");
});

// given a valid reset token, update the user's password
router.post("/resetPassword/verify", async (req, res) => {
    const userId = req.session.userId;

    // check that new password and reset token are provided
    const { newPassword, token } = req.body;
    if (!newPassword || !token) {
        return res
            .status(400)
            .send("New password and reset token are required");
    }

    // verify reset token
    const existingTokenData = await prisma.passwordResetToken.findUnique({
        where: {
            userId: userId,
        },
    });
    if (!existingTokenData) {
        return res
            .status(404)
            .send("No active reset token found for this user");
    }

    // if token is present but expired, delete from database and send error status
    if (existingTokenData.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({
            where: {
                userId: userId,
            },
        });

        return res.status(401).send("Token expired");
    }

    const isValidToken = bcrypt.compare(token, existingTokenData.token);

    if (!isValidToken) {
        return res.status(401).send("Invalid token");
    }

    // validate password
    if (newPassword.length < 12) {
        return res.status(400).send("Password must be 12 characters or longer");
    }

    // change user's password
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: await bcrypt.hash(newPassword, 10),
        },
    });

    // delete token from database
    await prisma.passwordResetToken.delete({
        where: {
            userId: userId,
        },
    });

    res.send("Password updated");
});

module.exports = router;
