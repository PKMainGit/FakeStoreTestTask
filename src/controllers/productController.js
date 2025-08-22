import pool from "../db/index.js";

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      price_min,
      price_max,
      sort_by = "id",
      order = "asc",
    } = req.query;

    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];
    let idx = 1;

    // Фільтр по назві
    if (search) {
      query += ` AND name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    // Фільтр по категорії
    if (category) {
      query += ` AND category = $${idx++}`;
      params.push(category);
    }

    // Фільтр по ціні — тільки якщо задано і > 0
    const minPrice = Number(price_min);
    const maxPrice = Number(price_max);

    if (!isNaN(minPrice) && minPrice > 0) {
      query += ` AND price >= $${idx++}`;
      params.push(minPrice);
    }
    if (!isNaN(maxPrice) && maxPrice > 0) {
      query += ` AND price <= $${idx++}`;
      params.push(maxPrice);
    }

    // Сортування
    const allowedSortFields = ["name", "price", "id"];
    const allowedOrder = ["asc", "desc"];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : "id";
    const sortOrder = allowedOrder.includes(order.toLowerCase())
      ? order.toLowerCase()
      : "asc";

    query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

    const result = await pool.query(query, params);

    // Обробка image_urls
    const productsWithImages = result.rows.map((p) => ({
      ...p,
      image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
    }));

    res.json({
      totalCount: productsWithImages.length,
      products: productsWithImages,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, category, stock, description, image_urls } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products 
        (name, price, category, stock, description, image_urls) 
        VALUES ($1, $2, $3, $4, $5, $6::jsonb) 
        RETURNING *`,
      [
        name,
        price,
        category,
        stock,
        description,
        JSON.stringify(image_urls || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to create product", error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, stock, description, image_urls } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name=$1,
           price=$2,
           category=$3,
           stock=$4,
           description=$5,
           image_urls=$6::jsonb
       WHERE id=$7
       RETURNING *`,
      [
        name,
        price,
        category,
        stock,
        description,
        JSON.stringify(image_urls || []),
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to delete product", error: err.message });
  }
};
