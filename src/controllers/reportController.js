// src/controllers/reportController.js
import pool from "../db/index.js";

export const getReport = async (req, res) => {
  try {
    const { type } = req.params;

    if (type === "categories") {
      const result = await pool.query("SELECT DISTINCT category FROM products");
      return res.json(result.rows);
    }

    if (type === "products") {
      const result = await pool.query("SELECT * FROM products");
      return res.json(result.rows);
    }

    return res.status(400).json({ message: "Unknown report type" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
