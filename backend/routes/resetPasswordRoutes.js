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

// send email with code to reset user's password
router.post("/generate", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send("Email is required");
    }

    // get user's id
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        return res
            .status(404)
            .send("A user with the given email could not be found");
    }

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
            userId: user.id,
        },
        create: {
            userId: user.id,
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
router.post("/verify", async (req, res) => {
    // check that all data is provided
    const { newPassword, token, email } = req.body;

    if (!newPassword || !token || !email) {
        return res
            .status(400)
            .send("New password, reset token, and email are required");
    }

    // get user's id
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        return res
            .status(404)
            .send("A user with the given email could not be found");
    }

    // verify reset token
    const existingTokenData = await prisma.passwordResetToken.findUnique({
        where: {
            userId: user.id,
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
                userId: user.id,
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
            id: user.id,
        },
        data: {
            password: await bcrypt.hash(newPassword, 10),
        },
    });

    // delete token from database
    await prisma.passwordResetToken.delete({
        where: {
            userId: user.id,
        },
    });

    res.send("Password updated");
});

module.exports = router;
