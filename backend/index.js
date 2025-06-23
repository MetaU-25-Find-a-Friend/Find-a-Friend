const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: "Too many failed login attempts. Please try again later."
    }
})

const session = require("express-session");
app.use(session({
    secret: process.env.VITE_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on ${port}`)
})

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
            allowsLocation: false
        },
    });

    res.status(201).send("User created successfully");
});

// login user with given username and password
app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    // validate username and password input
    if (!email || !password) {
        return res.status(400).send("Username and password are required");
    }

    // attempt to find existing user
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!user) {
        return res.status(400).send("Invalid username or password");
    }

    // check that entered password is correct for this user
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return res.status(400).send("Invalid username or password");
    }

    // record user session
    req.session.userId = user.id;

    res.send("Login successful");
})

// check whether a user is logged in
app.post("/me", async (req, res) => {

    // if no id is saved in the session, send error message
    if (!req.session.userId) {
        res.status(401).send("User is not logged in");
    }

    // get and send logged-in user info
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.userId
        },
        select: {
            email: true
        }
    })

    res.json({
        id: user.id,
        email: user.email
    })
})