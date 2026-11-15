const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM stockvault.product WHERE is_active = TRUE) AS total_products,
        (SELECT COUNT(*) FROM stockvault.warehouse WHERE is_active = TRUE) AS total_warehouses,
        (SELECT COALESCE(SUM(qty_on_hand), 0) FROM stockvault.warehouse_stock) AS total_stock_units,
        (SELECT COALESCE(SUM(ws.qty_on_hand * p.unit_price), 0) FROM stockvault.warehouse_stock ws JOIN stockvault.product p USING (product_id)) AS total_inventory_value,
        (SELECT COUNT(*) FROM stockvault.vw_low_stock) AS low_stock_count,
        (SELECT COUNT(*) FROM stockvault.purchase_order WHERE status IN ('DRAFT', 'APPROVED')) AS pending_purchase_orders
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics" });
  }
});

module.exports = router;
