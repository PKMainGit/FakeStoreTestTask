// src/routes/user.js
import express from "express";
import { checkAdminRole } from "../controllers/userController.js";

const router = express.Router();

router.get("/check-admin-role", checkAdminRole);

export default router;
