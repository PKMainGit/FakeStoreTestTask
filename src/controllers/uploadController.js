import cloudinary from "../config/cloudinary.js";
import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage() });

// Хелпер з ретраями
async function withRetry(fn, retries = 2, delay = 500) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      if (err.http_code === 499 && attempt < retries) {
        console.warn(`Retrying... attempt ${attempt + 1}`);
        await new Promise((res) => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const urls = [];

    for (const file of req.files) {
      const result = await withRetry(
        () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
              { resource_type: "image" },
              (err, result) => (err ? reject(err) : resolve(result))
            );
            stream.end(file.buffer);
          }),
        2 // кількість повторів
      );

      urls.push({ url: result.secure_url, public_id: result.public_id });
    }

    return res.json({ urls });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Upload failed", error: err.message });
    }
  }
};

export const deleteImage = async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) return res.status(400).json({ message: "Missing public_id" });

  try {
    await withRetry(() => cloudinary.v2.uploader.destroy(public_id), 2);
    return res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Failed to delete image", error: err.message });
    }
  }
};
