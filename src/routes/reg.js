import express from "express";
import {
  checkAdminExists,
  verifyAdmin,
  createUser,
} from "../controllers/regController.js";

const router = express.Router();

router.get("/check-admin", checkAdminExists);
router.post("/verify-admin", verifyAdmin);
router.post("/create-user", createUser);

export default router;
