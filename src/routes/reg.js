import express from "express";
import {
  checkAdminExists,
  verifyAdmin,
  createUser,
} from "../controllers/regController.js";
import {
  authenticateToken,
  requireRole,
  allowIfNoAdmin
} from "../middlewares/authMiddleware.js";


const router = express.Router();

router.get("/check-admin", checkAdminExists);
router.post("/verify-admin", allowIfNoAdmin, verifyAdmin);
router.post(
  "/create-user",
  authenticateToken,
  requireRole("admin"),
  createUser
);

export default router;
