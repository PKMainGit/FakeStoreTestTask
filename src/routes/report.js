// src/routes/reportRoutes.js
import { Router } from "express";
import { getReport } from "../controllers/reportController.js";

const router = Router();

router.get("/:type", getReport);

export default router;
