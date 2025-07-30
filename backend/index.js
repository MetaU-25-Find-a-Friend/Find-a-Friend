// initialize server
const express = require("express");
const cors = require("cors");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173", /\.onrender\.com$/],
        credentials: true,
    }),
);

// initialize prisma
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

// setup login middleware
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const {
    RATE_LIMIT_INTERVAL,
    MAX_LOGIN_ATTEMPTS,
    SESSION_TIMEOUT,
} = require("./constants");

const loginLimiter = rateLimit({
    windowMs: RATE_LIMIT_INTERVAL,
    max: MAX_LOGIN_ATTEMPTS,
    message: {
        error: "Too many failed login attempts. Please try again later.",
    },
});

// setup session middleware and cookie settings

const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const session = require("express-session");
app.use(
    session({
        secret: process.env.VITE_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(prisma, {
            dbRecordIdIsSessionId: true,
        }),
        cookie: {
            maxAge: SESSION_TIMEOUT,
            sameSite:
                process.env.VITE_ENV_TYPE === "production" ? "none" : "lax",
            secure: process.env.VITE_ENV_TYPE === "production" ? true : false,
        },
    }),
);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});

// middleware to authenticate user before allowing certain actions
const authenticate = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).send("User is not logged in");
    }
    next();
};

// AUTHENTICATION ENDPOINTS

// create a new user with the given username and password
app.post("/signup", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // validate username and password
    if (!firstName || !lastName || !email || !password) {
        return res
            .status(400)
            .send("Name, username, and password are required");
    }

    if (password.length < 12) {
        return res.status(400).send("Password must be 12 characters or longer");
    }

    // check that email is not already in use
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (existingUser) {
        return res.status(400).send("Email is already in use");
    }

    // hash password and add to database
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            interests: Array(6).fill(0, 0, 6),
        },
    });

    res.status(201).send("User created successfully");
});

// login user with given username and password
app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    // validate username and password input
    if (!email || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    // attempt to find existing user
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!user) {
        return res.status(400).json({ error: "Invalid username or password" });
    }

    // check that entered password is correct for this user
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return res.status(400).json({ error: "Invalid username or password" });
    }

    // record user session
    req.session.userId = user.id;

    res.json({
        id: user.id,
        email: user.email,
    });
});

// check whether a user is logged in
app.post("/me", async (req, res) => {
    // if no id is saved in the session, send error message
    if (!req.session.userId) {
        return res.status(401).send("User is not logged in");
    }

    try {
        // get and send logged-in user info
        const user = await prisma.user.findUnique({
            where: {
                id: req.session.userId,
            },
            select: {
                id: true,
                email: true,
            },
        });

        res.json({
            id: user.id,
            email: user.email,
        });
    } catch (error) {
        res.status(404).send("User not found");
    }
});

// log out user and destroy session
app.post("/logout", authenticate, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).send("Failed to log out");
        }
        res.clearCookie("connect.sid");
        res.send("Successfully logged out");
    });
});

// OTHER ENDPOINT CATEGORIES

const userRouter = require("./routes/userRoutes");
app.use("/user", authenticate, userRouter);

const geolocationRouter = require("./routes/geolocationRoutes");
app.use("/geolocation", authenticate, geolocationRouter);

const weightsRouter = require("./routes/weightsRoutes");
app.use("/weights", authenticate, weightsRouter);

const messagesRouter = require("./routes/messagesRoutes");
app.use("/messages", authenticate, messagesRouter);

const friendRouter = require("./routes/friendRoutes");
app.use("/friend", authenticate, friendRouter);

const resetPasswordRouter = require("./routes/resetPasswordRoutes");
app.use("/resetPassword", resetPasswordRouter);

// MISC. UNIQUE ENDPOINTS

// block the specified user
app.post("/block/:id", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const toBlock = parseInt(req.params.id);

    const userToBlock = await prisma.user.findUnique({
        where: {
            id: toBlock,
        },
        select: {
            friends: true,
        },
    });

    if (!userToBlock) {
        return res.status(404).send("User to block not found");
    }

    // add to blocked users array
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            blockedUsers: {
                push: toBlock,
            },
        },
    });

    // check whether users were previously friends
    const { friends } = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            friends: true,
        },
    });

    if (friends.includes(toBlock)) {
        // remove friend relationship
        const updatedFriends = friends.filter((element) => element !== toBlock);
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                friends: updatedFriends,
            },
        });

        const updatedBlockedUserFriends = userToBlock.friends.filter(
            (element) => element !== userId,
        );
        await prisma.user.update({
            where: {
                id: toBlock,
            },
            data: {
                friends: updatedBlockedUserFriends,
            },
        });

        const friendRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    {
                        fromUser: userId,
                        toUser: toBlock,
                    },
                    {
                        fromUser: toBlock,
                        toUser: userId,
                    },
                ],
            },
        });

        if (friendRequest) {
            await prisma.friendRequest.delete({
                where: {
                    id: friendRequest.id,
                },
            });
        }
    }

    res.send("User blocked");
});

// unblock the specified user
app.post("/unblock/:id", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const toUnblock = parseInt(req.params.id);

    const { blockedUsers } = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            blockedUsers: true,
        },
    });

    if (!blockedUsers.includes(toUnblock)) {
        return res.status(400).send("User was not blocked");
    }

    const updatedBlocked = blockedUsers.filter(
        (element) => element !== toUnblock,
    );

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            blockedUsers: updatedBlocked,
        },
    });

    res.send("User unblocked");
});

// get the number of unread messages from the other user and the latest unread message if one exists
app.get("/unreadMessages/:other", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const otherId = parseInt(req.params.other);

    const unreadCount = await prisma.message.count({
        where: {
            fromUser: otherId,
            toUser: userId,
            read: false,
        },
    });

    if (unreadCount > 0) {
        const latestUnread = await prisma.message.findFirst({
            take: 1,
            where: {
                fromUser: otherId,
                toUser: userId,
                read: false,
            },
            orderBy: {
                timestamp: "desc",
            },
        });

        res.json({
            unreadCount: unreadCount,
            latestUnread: latestUnread.text,
        });
    } else {
        res.json({
            unreadCount: unreadCount,
        });
    }
});

// get the number of messages sent between two users
app.get("/numMessages/:one/:other", authenticate, async (req, res) => {
    const oneId = parseInt(req.params.one);

    const otherId = parseInt(req.params.other);

    const num = await prisma.message.count({
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

    res.json({
        count: num,
    });
});
