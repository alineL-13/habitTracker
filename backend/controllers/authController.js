import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../database/db.js";

export async function signup(req, res) {
    try {
        const {
            username, password, confirmPassword
        } = req.body;

        if (!username || !password || !confirmPassword) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: "Passwords do not match"
            });
        }
        const userExists = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]); //aqui n precisa fazer o connect() e o release()
        if (userExists.rows.length > 0) {
            return res.status(400).json({
                error: "Username alredy exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = await pool.query(`
                INSERT INTO users (username, password_hash)
                VALUES ($1, $2)
                RETURNING id, username, created_at
            `, [username, passwordHash]);
        
        res.status(201).json({
            message: "User created successfully",
            //user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export async function login(req, res) {
    try {
        const {
            username, 
            password
        } = req.body;
        if (!username || !password){
            return res.status(400).json({
                error: "All fields are required"
            });
        }
        const userResult = await pool.query(`
                SELECT * FROM users WHERE username = $1
            `, [username]);
        if (userResult.rowCount === 0){
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if(!passwordMatch) {
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }
        const token = jwt.sign(
            {
                sub: user.id, //user "sub" pro ID é padrão, significa "subject"
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );
        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export async function checkLoggedUser(req, res) { 
    res.status(200).json({"username": req.user.username});
}