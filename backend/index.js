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

const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const { RATE_LIMIT_INTERVAL, MAX_LOGIN_ATTEMPTS } = require("./constants");

const loginLimiter = rateLimit({
    windowMs: RATE_LIMIT_INTERVAL,
    max: MAX_LOGIN_ATTEMPTS,
    message: {
        error: "Too many failed login attempts. Please try again later.",
    },
});

const session = require("express-session");
app.use(
    session({
        secret: process.env.VITE_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
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
    const { email, password } = req.body;

    // validate username and password
    if (!email || !password) {
        return res.status(400).send("Username and password are required");
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
            firstName: "",
            lastName: "",
            interests: Array(6),
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
});

// log out user and destroy session
app.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).send("Failed to log out");
        }
        res.clearCookie("connect.sid");
        res.send("Successfully logged out");
    });
});

// get a user's profile
app.get("/user/:id", async (req, res) => {
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

// update a user's profile
app.post("/user/:id", async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            ...req.body,
        },
    });

    res.json(user);
});

// update a user's location
app.post("/user/location/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);

    await prisma.userLocation.upsert({
        create: {
            userId: userId,
            latitude: req.body.lat,
            longitude: req.body.lng,
        },
        update: {
            latitude: req.body.lat,
            longitude: req.body.lng,
        },
        where: {
            userId: userId,
        },
    });

    res.send("Successfully updated");
});

// remove a user's location data from the database
app.delete("/user/location/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);

    const recordExists =
        (await prisma.userLocation.count({
            where: {
                userId: userId,
            },
        })) > 0;

    if (!recordExists) {
        res.status(404).send("No record to delete");
    }
    await prisma.userLocation.delete({
        where: {
            userId: userId,
        },
    });

    res.send("Successfully deleted");
});

// gets ids and locations of active users other than the specified id
app.get("/users/otherLocations/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);

    const locations = await prisma.userLocation.findMany({
        where: {
            NOT: {
                userId: userId,
            },
        },
    });

    res.json(locations);
});
