const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.transfer_id, t.quantity, t.status, t.created_at,
        fw.name AS from_warehouse,
        tw.name AS to_warehouse,
        p.sku, p.name AS product_name
      FROM stockvault.stock_transfer t
      JOIN stockvault.warehouse fw ON fw.warehouse_id = t.from_warehouse_id
      JOIN stockvault.warehouse tw ON tw.warehouse_id = t.to_warehouse_id
      JOIN stockvault.product p USING (product_id)
      ORDER BY t.created_at DESC
    `);

    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Stock transfers API error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch stock transfers" });
  }
});

router.post("/", async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, product_id, quantity } = req.body;

  if (!from_warehouse_id || !to_warehouse_id || !product_id || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, message: "Provide valid source warehouse, destination warehouse, product and positive integer quantity" });
  }

  try {
    const result = await pool.query(
      "SELECT stockvault.fn_transfer_stock($1, $2, $3, $4) AS transfer_id",
      [from_warehouse_id, to_warehouse_id, product_id, quantity]
    );

    res.status(201).json({ success: true, message: "Stock transferred successfully", transfer_id: result.rows[0].transfer_id });
  } catch (error) {
    console.error("Stock transfer error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
