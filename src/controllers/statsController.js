import pool from "../db/index.js"; // ваш pool.js з підключенням до Postgres

export const getStats = async (req, res) => {
  try {
    // 1. Статистика по товарам у магазині (storeItems) та на складі (warehouseItems)
    const storeItemsQuery = `
      SELECT id, name, price, stock AS quantity, category
      FROM products
      ORDER BY name
    `;
    const storeItemsResult = await pool.query(storeItemsQuery);
    const storeItems = storeItemsResult.rows;

    // Для warehouseItems можна відфільтрувати, наприклад, продукти із stock > 50
    const warehouseItemsQuery = `
      SELECT id, name, price, stock AS quantity, category
      FROM products
      WHERE stock > 50
      ORDER BY name
    `;
    const warehouseItemsResult = await pool.query(warehouseItemsQuery);
    const warehouseItems = warehouseItemsResult.rows;

    // 2. Продажі: today, week, month, year
    const salesPeriods = {
      today: "1 day",
      week: "7 days",
      month: "1 month",
      year: "1 year",
    };

    const sales = {};
    for (const [key, interval] of Object.entries(salesPeriods)) {
      const salesQuery = `
        SELECT 
          COUNT(*) AS count,
          COALESCE(SUM(total),0) AS total,
          COUNT(DISTINCT customer_id) AS clients
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      `;
      const result = await pool.query(salesQuery);
      sales[key] = {
        count: parseInt(result.rows[0].count),
        total: parseFloat(result.rows[0].total),
        clients: parseInt(result.rows[0].clients),
      };
    }

    // 3. Можна додати топ-продукти (найпродаваніші) через order_items
    const topProductsQuery = `
      SELECT p.id, p.name, p.category, SUM(oi.quantity) AS sold_quantity, p.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY sold_quantity DESC
      LIMIT 5
    `;
    const topProductsResult = await pool.query(topProductsQuery);
    const topProducts = topProductsResult.rows;

    // 4. Відповідь
    res.json({
      storeItems,
      warehouseItems,
      sales,
      topProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
