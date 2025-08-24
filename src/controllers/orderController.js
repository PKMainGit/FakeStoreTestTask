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
  INSERT INTO orders (items, total, created_at, status)
  VALUES ($1, $2, NOW(), 'pending')
  RETURNING id, total, items, created_at, status;
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
    const { rows } = await pool.query(`
      SELECT o.id, o.items, o.total, o.status, o.created_at,
             json_agg(json_build_object(
               'product_id', oi.product_id,
               'quantity', oi.quantity,
               'price', oi.price
             )) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Помилка при отриманні замовлень:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'shipped' | 'delivered'

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Status updated", order: result.rows[0] });
  } catch (error) {
    console.error("Помилка при оновленні статусу:", error);
    res.status(500).json({ message: "Server error" });
  }
};
