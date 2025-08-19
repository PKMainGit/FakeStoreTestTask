import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Захищений маршрут дашборду
router.get("/", authenticateToken, (req, res) => {
  // req.user вже містить username і role із токена
  res.status(200).json({
    message: `Welcome, ${req.user.username}!`,
    role: req.user.role,
  });
});

export default router;
