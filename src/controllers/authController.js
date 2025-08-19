// src/controllers/authController.js
import pool from "../db/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Шукаємо користувача у таблиці users
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Генеруємо JWT
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Встановлюємо HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // JS не бачить куку
      secure: false, // true якщо HTTPS
      sameSite: "lax", // захист від CSRF
      maxAge: 60 * 60 * 1000, // 1 година
    });

    // Можна повернути мінімальну інформацію користувача
    res.status(200).json({ username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  // очищаємо HTTP-only cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true у продакшн
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
