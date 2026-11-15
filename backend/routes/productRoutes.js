const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT category_id, name FROM stockvault.category ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.sku, p.name, p.category_id, c.name AS category_name,
        p.unit_price, p.reorder_threshold, p.is_active,
        COALESCE(SUM(ws.qty_on_hand), 0) AS total_stock
      FROM stockvault.product p
      JOIN stockvault.category c USING (category_id)
      LEFT JOIN stockvault.warehouse_stock ws USING (product_id)
      GROUP BY p.product_id, c.name ORDER BY p.product_id
    `);
    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  const { sku, name, category_id, unit_price, reorder_threshold = 5 } = req.body;
  if (!sku?.trim() || !name?.trim() || !Number.isInteger(Number(category_id)) || !Number.isFinite(Number(unit_price)) || Number(unit_price) < 0 || !Number.isInteger(Number(reorder_threshold)) || Number(reorder_threshold) < 0) {
    return res.status(400).json({ success: false, message: "Enter valid SKU, name, category, price and reorder threshold." });
  }
  try {
    const result = await pool.query(`
      INSERT INTO stockvault.product (sku, name, category_id, unit_price, reorder_threshold)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [sku.trim(), name.trim(), Number(category_id), Number(unit_price), Number(reorder_threshold)]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, message: error.code === "23505" ? "This SKU already exists." : error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { sku, name, category_id, unit_price, reorder_threshold } = req.body;
  if (!sku?.trim() || !name?.trim() || !Number.isInteger(Number(category_id)) || !Number.isFinite(Number(unit_price)) || Number(unit_price) < 0 || !Number.isInteger(Number(reorder_threshold)) || Number(reorder_threshold) < 0) {
    return res.status(400).json({ success: false, message: "Enter valid product details." });
  }
  try {
    const result = await pool.query(`
      UPDATE stockvault.product SET sku=$1, name=$2, category_id=$3, unit_price=$4, reorder_threshold=$5
      WHERE product_id=$6 RETURNING *
    `, [sku.trim(), name.trim(), Number(category_id), Number(unit_price), Number(reorder_threshold), req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, message: error.code === "23505" ? "This SKU already exists." : error.message });
  }
});

router.patch("/:id/deactivate", async (req, res) => {
  try {
    const result = await pool.query("UPDATE stockvault.product SET is_active = FALSE WHERE product_id = $1 RETURNING product_id, name, is_active", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
