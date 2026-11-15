const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL REPORTS
router.get("/", async (req, res) => {
  try {
    const [
      inventory,
      warehouses,
      suppliers,
      purchaseOrders,
      movements,
      lowStock
    ] = await Promise.all([

      // INVENTORY VALUATION
      pool.query(`
        SELECT
          COUNT(DISTINCT p.product_id)::INTEGER AS total_products,
          COUNT(DISTINCT p.product_id) FILTER (WHERE p.is_active)::INTEGER AS active_products,
          COALESCE(SUM(ws.qty_on_hand), 0)::BIGINT AS total_stock_units,
          COALESCE(SUM(ws.qty_on_hand * p.unit_price), 0)::NUMERIC(14,2) AS inventory_value
        FROM stockvault.product p
        LEFT JOIN stockvault.warehouse_stock ws USING (product_id)
      `),

      // WAREHOUSE PERFORMANCE
      pool.query(`
        SELECT
          w.warehouse_id,
          w.code,
          w.name AS warehouse_name,
          w.city,
          COUNT(ws.product_id)::INTEGER AS product_types,
          COALESCE(SUM(ws.qty_on_hand), 0)::BIGINT AS stock_units,
          COALESCE(SUM(ws.qty_on_hand * p.unit_price), 0)::NUMERIC(14,2) AS inventory_value
        FROM stockvault.warehouse w
        LEFT JOIN stockvault.warehouse_stock ws USING (warehouse_id)
        LEFT JOIN stockvault.product p USING (product_id)
        GROUP BY w.warehouse_id
        ORDER BY inventory_value DESC
      `),

      // SUPPLIER PERFORMANCE
      pool.query(`
        SELECT
          s.supplier_id,
          s.name AS supplier_name,
          s.avg_lead_days,
          s.rating,
          COUNT(DISTINCT po.po_id)::INTEGER AS total_orders,
          COALESCE(SUM(poi.ordered_qty * poi.unit_price), 0)::NUMERIC(14,2) AS procurement_value
        FROM stockvault.supplier s
        LEFT JOIN stockvault.purchase_order po USING (supplier_id)
        LEFT JOIN stockvault.purchase_order_item poi USING (po_id)
        GROUP BY s.supplier_id
        ORDER BY procurement_value DESC
      `),

      // PURCHASE ORDER ANALYTICS
      pool.query(`
        SELECT
          status,
          COUNT(*)::INTEGER AS order_count,
          COALESCE(SUM(total_value), 0)::NUMERIC(14,2) AS order_value
        FROM (
          SELECT
            po.po_id,
            po.status,
            COALESCE(SUM(poi.ordered_qty * poi.unit_price), 0) AS total_value
          FROM stockvault.purchase_order po
          LEFT JOIN stockvault.purchase_order_item poi USING (po_id)
          GROUP BY po.po_id, po.status
        ) order_summary
        GROUP BY status
        ORDER BY status
      `),

      // STOCK MOVEMENT HISTORY
      pool.query(`
        SELECT
          t.transfer_id,
          t.created_at,
          t.quantity,
          p.sku,
          p.name AS product_name,
          fw.name AS from_warehouse,
          tw.name AS to_warehouse,
          t.status
        FROM stockvault.stock_transfer t
        JOIN stockvault.product p USING (product_id)
        JOIN stockvault.warehouse fw ON fw.warehouse_id = t.from_warehouse_id
        JOIN stockvault.warehouse tw ON tw.warehouse_id = t.to_warehouse_id
        ORDER BY t.created_at DESC
        LIMIT 20
      `),

      // LOW STOCK ANALYTICS
      pool.query(`
        SELECT
          a.alert_id,
          a.current_qty,
          a.reorder_threshold,
          a.generated_at,
          p.sku,
          p.name AS product_name,
          w.name AS warehouse_name
        FROM stockvault.reorder_alert a
        JOIN stockvault.product p USING (product_id)
        JOIN stockvault.warehouse w USING (warehouse_id)
        ORDER BY a.current_qty ASC, a.generated_at DESC
      `)
    ]);

    res.json({
      success: true,
      data: {
        inventory: inventory.rows[0],
        warehouses: warehouses.rows,
        suppliers: suppliers.rows,
        purchaseOrders: purchaseOrders.rows,
        movements: movements.rows,
        lowStock: lowStock.rows
      }
    });

  } catch (error) {
    console.error("Reports API error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate reports"
    });
  }
});

module.exports = router;
