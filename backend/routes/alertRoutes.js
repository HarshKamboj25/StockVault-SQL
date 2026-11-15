const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.alert_id, a.current_qty, a.reorder_threshold, a.generated_at,
        w.name AS warehouse_name, p.sku, p.name AS product_name
      FROM stockvault.reorder_alert a
      JOIN stockvault.warehouse w USING (warehouse_id)
      JOIN stockvault.product p USING (product_id)
      ORDER BY a.generated_at DESC, a.alert_id
    `);

    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Alerts API error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    await pool.query("CALL stockvault.sp_generate_reorder_alerts()");
    const result = await pool.query(`
      SELECT a.alert_id, a.current_qty, a.reorder_threshold,
        w.name AS warehouse_name, p.sku, p.name AS product_name
      FROM stockvault.reorder_alert a
      JOIN stockvault.warehouse w USING (warehouse_id)
      JOIN stockvault.product p USING (product_id)
      ORDER BY a.warehouse_id, a.product_id
    `);

    res.json({ success: true, message: "Reorder alerts generated successfully", count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Generate alerts error:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate reorder alerts" });
  }
});

module.exports = router;
