const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.warehouse_id, w.code, w.name, w.city,
        w.capacity_units, w.is_active,
        COUNT(ws.product_id)::INTEGER AS product_types,
        COALESCE(SUM(ws.qty_on_hand), 0) AS total_stock_units,
        COALESCE(SUM(ws.qty_on_hand * p.unit_price), 0)::NUMERIC(14,2) AS inventory_value
      FROM stockvault.warehouse w
      LEFT JOIN stockvault.warehouse_stock ws USING (warehouse_id)
      LEFT JOIN stockvault.product p USING (product_id)
      GROUP BY w.warehouse_id
      ORDER BY w.warehouse_id
    `);

    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Warehouses API error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch warehouses" });
  }
});

router.get("/:id/inventory", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.sku, p.name AS product_name,
        p.unit_price, p.reorder_threshold, ws.qty_on_hand,
        ws.bin_location, ws.updated_at
      FROM stockvault.warehouse_stock ws
      JOIN stockvault.product p USING (product_id)
      WHERE ws.warehouse_id = $1
      ORDER BY p.name
    `, [req.params.id]);

    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Warehouse inventory error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch warehouse inventory" });
  }
});

module.exports = router;
