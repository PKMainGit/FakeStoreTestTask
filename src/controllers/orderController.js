import pool from "../db/index.js";

// створення замовлення
export const createOrder = async (req, res) => {
  try {
    const { items, total } = req.body; // items = масив CartProduct[]
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Корзина порожня" });
    }

    const query = `
      INSERT INTO orders (items, total)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [JSON.stringify(items), total];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Помилка при створенні замовлення:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// отримати всі замовлення
export const getOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Помилка при отриманні замовлень:", error);
    res.status(500).json({ message: "Server error" });
  }
};
