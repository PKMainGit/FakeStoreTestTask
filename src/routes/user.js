// src/routes/user.js
import express from "express";
import { checkAdminRole } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/check-admin-role",authenticateToken, checkAdminRole);

export default router;
