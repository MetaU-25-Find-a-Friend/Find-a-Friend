const express = require("express");

const router = express.Router({ mergeParams: true });

// initialize prisma
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// initialize mail transporter
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
    },
});

// initialize token generator and hasher
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { TOKEN_ALIVE_TIME, PASSWORD_SALT_ROUNDS } = require("../constants");

// send email with link to reset user's password
router.post("/generate", async (req, res) => {
    // use email since user can't be authenticated
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
            .send("A user with the given email could not be found.");
    }

    // check email connection
    try {
        await transporter.verify();
    } catch (error) {
        return res
            .status(500)
            .send(`Error connecting to SMTP server: ${error}`);
    }

    // generate token and store in database
    const token = crypto.randomBytes(32).toString("hex");
    const encryptedToken = await bcrypt.hash(token, PASSWORD_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + TOKEN_ALIVE_TIME);
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

    // build link using token
    const link = `${process.env.FRONTEND_URL}/resetpassword?token=${token}`;

    // send email
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

    res.send("Successfully sent email.");
});

// check reset token validity and update the user's password
router.post("/verify", async (req, res) => {
    // check that all data is provided
    const { newPassword, token, email } = req.body;

    if (!newPassword || !token || !email) {
        return res.status(400).send("All fields are required.");
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

    const invalidMessage = "Invalid email or reset password link.";

    if (!user) {
        return res.status(401).send(invalidMessage);
    }

    // verify that the user has requested to reset their password
    const existingTokenData = await prisma.passwordResetToken.findUnique({
        where: {
            userId: user.id,
        },
    });
    if (!existingTokenData) {
        return res.status(401).send(invalidMessage);
    }

    // if token is present but expired, delete from database and send error status
    if (existingTokenData.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({
            where: {
                userId: user.id,
            },
        });

        return res.status(401).send(invalidMessage);
    }

    // verify that given token and active token match
    const isValidToken = bcrypt.compare(token, existingTokenData.token);

    if (!isValidToken) {
        return res.status(401).send(invalidMessage);
    }

    // validate password
    if (newPassword.length < 12) {
        return res
            .status(400)
            .send("Password must be 12 characters or longer.");
    }

    // change user's password
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS),
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
