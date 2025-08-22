import express from "express";
import { uploadImages, deleteImage } from "../controllers/uploadController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("images", 5), uploadImages);
router.post("/delete-image", deleteImage);

export default router;
