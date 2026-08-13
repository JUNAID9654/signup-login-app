require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
}

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
    )
`);

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            error: "Access denied. Please login."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {

        if (err) {
            return res.status(403).json({
                error: "Invalid or expired token"
            });
        }
        req.user = user;
        next();
    });
}

app.get("/latest-user", authenticateToken, (req, res) => {
    const sql = `
        SELECT id, name, email
        FROM users
        WHERE id = ?
    `;
    db.get(sql, [req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.json(row);
    });
});

db.run(`ALTER TABLE users ADD COLUMN email TEXT`, function (err) {
    // Ignore error if column already exists
});

db.run(`ALTER TABLE users ADD COLUMN password TEXT`, function (err) {
    // Ignore error if column already exists
});

app.get("/message", authenticateToken, function (req, res) {

    const name = req.query.name;

    db.run(
        "UPDATE users SET name = ? WHERE id = ?",
        [name, req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.send("Hello " + name);
        }
    );
});


app.get("/latest-user", authenticateToken, (req, res) => {
    const sql = `
        SELECT id, name
        FROM users
        ORDER BY id DESC
        LIMIT 1
    `;
    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.json(row);
    });
});

app.get("/update-user", authenticateToken, (req, res) => {

    const name = req.query.name;

    db.run(
        "UPDATE users SET name = ? WHERE id = ?",
        [name, req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.send("User updated successfully");
        }
    );
});


app.get("/delete-user", authenticateToken, (req, res) => {

    db.run(
        "DELETE FROM users WHERE id = ?",
        [req.user.id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.send("User deleted successfully");
        }
    );
});

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: "Password must be at least 6 characters"
        });
    }

    db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (user) {
                return res.status(409).json({
                    error: "Email already registered"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.run(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        message: "User registered successfully",
                        id: this.lastID
                    });

                }
            );

        }
    );

});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) {
    return res.status(400).json({
        error: "Email and password are required"
        });
    }

    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    error: "Invalid email or password"
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    error: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },
                JWT_SECRET,
                {
                    expiresIn: "1h"
                }
            );

            res.json({
                message: "Login successful",
                token: token
            });

        }
    );

});

app.get("/protected", authenticateToken, (req, res) => {

    res.json({
        message: "You are authenticated!",
        user: req.user
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log("Server is running on port " + PORT);
});