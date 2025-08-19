import pool from "../db/index.js";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Client } = pkg;

export const checkAdminExists = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role = $1", [
      "admin",
    ]);

    if (result.rows.length > 0) {
      // admin є
      return res.status(200).json({ exists: true });
    } else {
      // admin відсутній
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyAdmin = async (req, res) => {
  const { username, password, newUser } = req.body;

  const client = new Client({
    host: "localhost",
    database: "FakeStore",
    user: username,
    password: password,
    port: 5432,
  });

  try {
    // 1. Верифікація адміна
    await client.connect();
    await client.query("SELECT 1");
    await client.end();

    // 2. Хешування пароля нового юзера
    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    // 3. Створення користувача
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [newUser.username, hashedPassword, newUser.role]
    );

    return res.status(200).json({ message: "Admin verified & user created" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
};

export const createUser = async (req, res) => {
	try {
		const newUser = req.body;		

    if (!newUser.username || !newUser.password || !newUser.role) {
      return res.status(400).json({ message: "Missing user data" });
    }

    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      [newUser.username, hashedPassword, newUser.role]
    );

    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};



