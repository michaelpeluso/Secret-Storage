// import dependencies
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

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
db.connect();

// web get routes
app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

// web get routes

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
                    console.log(error);
                }
                // add email and hash to db
                const result = await db.query("INSERT INTO users(email, password) VALUES($1, $2)", [email, hash]);
                console.log(result);
                res.render("secrets.ejs");
            });
        }
    } catch (e) {
        console.log(e);
    }
});

// log in users
app.post("/login", async (req, res) => {
    const email = req.body.username;
    const loginPassword = req.body.password;

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        // check if user exists
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;

            // compare hashes
            bcrypt.compare(loginPassword, storedHashedPassword, (error, result) => {
                if (error) {
                    console.log("Error comparing passwords: ", error);
                } else {
                    if (result) {
                        res.render("secrets.ejs");
                    } else {
                        res.render("Incorrect password.");
                    }
                }
            });
        } else {
            res.send("User not found.");
        }
    } catch (e) {
        console.log(e);
    }
});

// server listening
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
