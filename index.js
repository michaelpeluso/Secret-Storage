// import dependencies
import env from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

// init global variables
const app = express();
const port = 3000;
const saltRounds = 10; // hashing loops

env.config();
const db = new pg.Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432,
});

// init maintenance
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
        secret: "TOPSECRETWORD",
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60, // one hour
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

db.connect();

/*
 * web get routes
 */
app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/secrets", (req, res) => {
    // check for authenticated user
    console.log(req.user);
    if (req.isAuthenticated()) {
        res.render("secrets.ejs");
    } else {
        res.render("/login");
    }
});

/*
 * web post routes
 */

// register users
app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        // check if user exists
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length > 0) {
            res.send("Email already exists. Try logging in.");
        } else {
            // password hashing
            bcrypt.hash(password, saltRounds, async (error, hash) => {
                if (error) {
                    console.log("Error hashing password: ", error);
                }
                // add email and hash to db
                const result = await db.query("INSERT INTO users(email, password) VALUES($1, $2) RETURNING *", [email, hash]);
                const user = result.rows[0];
                req.login(user, (error) => {
                    console.log(error);
                    res.redirect("/secrets");
                });
            });
        }
    } catch (e) {
        console.log(e);
    }
});

// log in users
app.post(
    "/login",
    // middleware remembers logged in users
    passport.authenticate("local", {
        successRedirect: "/secrets",
        failureRedirect: "/login",
    })
);

// verifies user in session - executed on .isAuthenticated()
passport.use(
    new Strategy(async function verify(username, password, cb) {
        console.log(username);

        try {
            // check if user exists
            const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;

                // compare hashes
                bcrypt.compare(password, storedHashedPassword, (error, result) => {
                    if (error) {
                        return cb(error);
                    } else {
                        if (result) {
                            // return authenticated user
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                });
            } else {
                return cb("User not found.");
            }
        } catch (e) {
            return cb(e);
        }
    })
);

// save & serializes logged in user data to local storage
passport.serializeUser((user, cb) => {
    cb(null, user);
});

// deserializes user data in local storage
passport.deserializeUser((user, cb) => {
    cb(null, user);
});

// server listening
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
