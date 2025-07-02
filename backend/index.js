// initialize server
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173",
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
    GEOHASH_DUP_RES,
} = require("./constants");

const loginLimiter = rateLimit({
    windowMs: RATE_LIMIT_INTERVAL,
    max: MAX_LOGIN_ATTEMPTS,
    message: {
        error: "Too many failed login attempts. Please try again later.",
    },
});

// setup session middleware and cookie settings
const session = require("express-session");
app.use(
    session({
        secret: process.env.VITE_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: SESSION_TIMEOUT,
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

// get a user's profile
app.get("/user/:id", authenticate, async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            firstName: true,
            lastName: true,
            pronouns: true,
            age: true,
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

app.get("/user/details/:id", authenticate, async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pronouns: true,
            age: true,
            major: true,
            interests: true,
            bio: true,
            friends: true,
            blockedUsers: true,
            interests: true,
        },
    });

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.json(user);
});

// get a user's friends and interests
app.get("/user/friendsAndInterests/:id", authenticate, async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            friends: true,
            interests: true,
        },
    });

    if (!user) {
        return res.status(404).send("User not found");
    }

    res.json(user);
});

// update the logged-in user's profile
app.post("/user", authenticate, async (req, res) => {
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

// update the logged-in user's location
app.post("/user/geolocation", authenticate, async (req, res) => {
    const userId = req.session.userId;

    await prisma.userGeohashes.upsert({
        create: {
            userId: userId,
            geohash: req.body.geohash,
        },
        update: {
            geohash: req.body.geohash,
        },
        where: {
            userId: userId,
        },
    });

    res.send("Location updated");
});

// remove the logged-in user's location data from the database
app.delete("/user/geolocation", authenticate, async (req, res) => {
    const userId = req.session.userId;
    try {
        await prisma.userGeohashes.delete({
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
app.get("/users/otherGeolocations", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const locations = await prisma.userGeohashes.findMany({
        where: {
            NOT: {
                userId: userId,
            },
        },
    });

    res.json(locations);
});

// add a new record to user's past locations if it is not a duplicate (too close to an existing past location)
app.post("/user/geolocation/history", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const hash = req.body.geohash;

    if (!hash) {
        return res.status(400).send("Geohash is required");
    }

    const duplicateExists =
        (await prisma.userPastGeohashes.count({
            where: {
                userId: userId,
                geohash: {
                    startsWith: hash.slice(0, GEOHASH_DUP_RES),
                },
            },
        })) > 0;

    if (duplicateExists) {
        return res.status(409).send("This location has already been recorded");
    }

    await prisma.userPastGeohashes.create({
        data: {
            userId: userId,
            timestamp: new Date(),
            geohash: hash,
        },
    });

    res.send("Successfully recorded");
});

// get all of user's past locations
app.get("/user/geolocation/history", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const history = await prisma.userPastGeohashes.findMany({
        where: {
            userId: userId,
        },
    });

    res.json(history);
});

// create a friend request from the logged-in user to another user
app.post("/friend/:to", authenticate, async (req, res) => {
    const from = req.session.userId;

    const to = parseInt(req.params.to);

    // check whether an active friend request exists between them or they are already friends
    const duplicateExists =
        (await prisma.friendRequest.count({
            where: {
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
app.get("/friend", async (req, res) => {
    const userId = req.session.userId;

    const requests = await prisma.friendRequest.findMany({
        where: {
            toUser: userId,
        },
    });

    res.json(requests);
});

// delete the friend request from the specified user to the logged-in user and make them friends
app.post("/friend/accept/:from", async (req, res) => {
    const to = req.session.userId;

    const from = parseInt(req.params.from);

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
    const { id } = await prisma.friendRequest.findFirst({
        where: {
            fromUser: from,
            toUser: to,
        },
        select: {
            id: true,
        },
    });

    await prisma.friendRequest.delete({
        where: {
            id: id,
        },
    });

    res.send("Request accepted");
});

// delete the friend request from the specified user to the logged-in user
app.post("/friend/decline/:from", async (req, res) => {
    const to = req.session.userId;

    const from = parseInt(req.params.from);

    const { id } = await prisma.friendRequest.findFirst({
        where: {
            fromUser: from,
            toUser: to,
        },
        select: {
            id: true,
        },
    });

    await prisma.friendRequest.delete({
        where: {
            id: id,
        },
    });

    res.send("Request declined");
});

// block the specified user
app.post("/block/:id", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const toBlock = parseInt(req.params.id);

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

        const { friends: blockedUserFriends } = await prisma.user.findUnique({
            where: {
                id: toBlock,
            },
            select: {
                friends: true,
            },
        });

        const updatedBlockedUserFriends = blockedUserFriends.filter(
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

// get all messages to the logged-in user from the specified user
app.get("/messages/:from", authenticate, async (req, res) => {
    const userId = req.session.userId;

    const fromId = parseInt(req.params.from);

    const messages = await prisma.message.findMany({
        where: {
            toUser: userId,
            fromUser: fromId,
        },
    });

    res.json(messages);
});

// send a message to the specified user
app.post("/messages/:to", authenticate, async (req, res) => {
    const from = req.session.userId;

    const to = parseInt(req.params.to);

    const { text } = req.body;

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
