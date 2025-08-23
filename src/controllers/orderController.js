import pool from "../db/index.js";

// створення замовлення
export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { items, total } = req.body; // items = масив CartProduct[]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Корзина порожня" });
    }

    await client.query("BEGIN");

    // 1️⃣ Додаємо замовлення в orders
    const orderQuery = `
      INSERT INTO orders (items, total, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id, total, items, created_at;
    `;
    const orderResult = await client.query(orderQuery, [
      JSON.stringify(items),
      total,
    ]);
    const order = orderResult.rows[0];

    // 2️⃣ Обробляємо товари
    for (const item of items) {
      // додаємо в order_items
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.id, item.quantity, item.price]
      );

      // оновлюємо залишок
      const result = await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.id]
      );

      if (result.rowCount === 0) {
        // якщо залишків нема → відкочуємо
        throw new Error(`Недостатньо товару (id: ${item.id})`);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Order created", orderId: order.id });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Помилка при створенні замовлення:", error);
    res.status(400).json({
      message: error.message || "Помилка при створенні замовлення",
    });
  } finally {
    client.release();
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
