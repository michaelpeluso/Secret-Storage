// import dependencies
import env from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";

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
    port: process.env.PG_PORT,
});

// init maintenance
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
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

app.get("/logout", (req, res) => {
    req.logout((error) => {
        if (error) console.log(error);
        res.redirect("/");
    });
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/secrets", (req, res) => {
    // check for authenticated user
    if (req.isAuthenticated()) {
        res.render("secrets.ejs");
    } else {
        res.render("/login");
    }
});

// route to google sign on
app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);
app.get(
    "/auth/google/secrets",
    passport.authenticate("google", {
        successRedirect: "/secrets",
        failureRedirect: "/login",
    })
);
/*
 * web post routes
 */

// log in users
app.post(
    "/login",
    // middleware remembers logged in users
    passport.authenticate("local", {
        successRedirect: "/secrets",
        failureRedirect: "/login",
    })
);

// register users
app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        // check if user exists
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length > 0) {
            res.redirect("/login");
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

/*
 *   app helper functions
 */

// verifies user in session - executed on .isAuthenticated()
passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
        try {
            // check if user exists
            const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;

                // compare hashes
                bcrypt.compare(password, storedHashedPassword, (error, valid) => {
                    if (error) {
                        console.error("Error comparing passwords:", err);
                        return cb(error);
                    } else {
                        if (valid) {
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
            console.log(e);
        }
    })
);

// allow Google sign on
passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/secrets",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        // store user data
        async (accessToken, refreshToken, profile, cb) => {
            try {
                console.log(profile);
                const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);
                // enter new user info into db
                if (result.rows.length === 0) {
                    const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [profile.email, "google"]);
                    return cb(null, newUser.rows[0]);
                }
                // user already logged in
                else {
                    return cb(null, result.rows[0]);
                }
            } catch (err) {
                return cb(err);
            }
        }
    )
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
