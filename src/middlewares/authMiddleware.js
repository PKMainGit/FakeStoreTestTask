// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import pool from "../db/index.js";

export const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.token; // тільки з cookies

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // кладемо дані юзера в req
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not found in request" });
    }

    if (user.role !== role) {
      return res
        .status(403)
        .json({ message: `Forbidden: Requires role ${role}` });
    }

    next();
  };
};

export const allowIfNoAdmin = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role = $1", [
      "admin",
    ]);

    if (result.rows.length > 0) {
      // адмін уже існує → блок
      return res.status(403).json({ message: "Admin already exists" });
    }

    // адміна нема → можна йти далі
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};