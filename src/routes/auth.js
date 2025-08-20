import express from "express";
import { login, logout } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", authenticateToken, logout);

export default router;
