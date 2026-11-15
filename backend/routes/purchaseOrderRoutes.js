const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL PURCHASE ORDERS
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        po.po_id, po.po_number, po.status, po.created_at, po.received_at,
        s.name AS supplier_name, w.name AS warehouse_name,
        COUNT(poi.po_item_id)::INTEGER AS item_count,
        COALESCE(SUM(poi.ordered_qty * poi.unit_price), 0)::NUMERIC(14,2) AS order_value
      FROM stockvault.purchase_order po
      JOIN stockvault.supplier s USING (supplier_id)
      JOIN stockvault.warehouse w USING (warehouse_id)
      LEFT JOIN stockvault.purchase_order_item poi USING (po_id)
      GROUP BY po.po_id, s.name, w.name
      ORDER BY po.created_at DESC
    `);

    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error("Purchase orders API error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch purchase orders" });
  }
});

// CREATE PURCHASE ORDER
router.post("/", async (req, res) => {
  const { supplier_id, warehouse_id, items } = req.body;

  if (!supplier_id || !warehouse_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Supplier, warehouse and at least one product are required"
    });
  }

  const productIds = items.map(item => Number(item.product_id));

  if (
    items.some(item =>
      !Number.isInteger(Number(item.product_id)) ||
      Number(item.product_id) <= 0 ||
      !Number.isInteger(Number(item.ordered_qty)) ||
      Number(item.ordered_qty) <= 0 ||
      !Number.isFinite(Number(item.unit_price)) ||
      Number(item.unit_price) < 0
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid product, quantity or unit price"
    });
  }

  if (new Set(productIds).size !== productIds.length) {
    return res.status(400).json({
      success: false,
      message: "A product can only appear once in an order"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const products = await client.query(
      `SELECT product_id FROM stockvault.product
       WHERE product_id = ANY($1::bigint[]) AND is_active = TRUE`,
      [productIds]
    );

    if (products.rowCount !== productIds.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid or inactive"
      });
    }

    const poNumber = `PO-${Date.now()}`;

    const order = await client.query(
      `INSERT INTO stockvault.purchase_order
       (po_number, supplier_id, warehouse_id, status)
       VALUES ($1, $2, $3, 'DRAFT')
       RETURNING *`,
      [poNumber, supplier_id, warehouse_id]
    );

    const poId = order.rows[0].po_id;

    for (const item of items) {
      await client.query(
        `INSERT INTO stockvault.purchase_order_item
         (po_id, product_id, ordered_qty, received_qty, unit_price)
         VALUES ($1, $2, $3, 0, $4)`,
        [poId, item.product_id, item.ordered_qty, item.unit_price]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: order.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create purchase order error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase order"
    });
  } finally {
    client.release();
  }
});


// GET PURCHASE ORDER DETAILS WITH ITEMS
router.get("/:id", async (req, res) => {
  try {
    const orderResult = await pool.query(`
      SELECT
        po.*,
        s.name AS supplier_name,
        w.name AS warehouse_name
      FROM stockvault.purchase_order po
      JOIN stockvault.supplier s USING (supplier_id)
      JOIN stockvault.warehouse w USING (warehouse_id)
      WHERE po.po_id = $1
    `, [req.params.id]);

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const itemsResult = await pool.query(`
      SELECT
        poi.po_item_id,
        poi.product_id,
        p.name AS product_name,
        p.sku,
        poi.ordered_qty,
        poi.received_qty,
        poi.unit_price,
        (poi.ordered_qty * poi.unit_price)::NUMERIC(14,2) AS item_total
      FROM stockvault.purchase_order_item poi
      JOIN stockvault.product p USING (product_id)
      WHERE poi.po_id = $1
      ORDER BY poi.po_item_id
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error("Purchase order details error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order details"
    });
  }
});
// APPROVE PURCHASE ORDER
router.patch("/:id/approve", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE stockvault.purchase_order
       SET status = 'APPROVED'
       WHERE po_id = $1 AND status = 'DRAFT'
       RETURNING *`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Draft purchase order not found or already processed"
      });
    }

    res.json({
      success: true,
      message: "Purchase order approved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Approve purchase order error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to approve purchase order"
    });
  }
});


// RECEIVE STOCK AGAINST PURCHASE ORDER
router.post("/:id/receive", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one received product is required"
    });
  }

  const productIds = items.map(item => Number(item.product_id));

  if (
    items.some(item =>
      !Number.isInteger(Number(item.product_id)) ||
      Number(item.product_id) <= 0 ||
      !Number.isInteger(Number(item.received_qty)) ||
      Number(item.received_qty) <= 0
    ) ||
    new Set(productIds).size !== productIds.length
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or duplicate product quantities"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT * FROM stockvault.purchase_order
       WHERE po_id = $1
       FOR UPDATE`,
      [req.params.id]
    );

    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const order = orderResult.rows[0];

    if (order.status !== "APPROVED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only approved purchase orders can receive stock"
      });
    }

    const itemResult = await client.query(
      `SELECT * FROM stockvault.purchase_order_item
       WHERE po_id = $1
       ORDER BY product_id
       FOR UPDATE`,
      [order.po_id]
    );

    const orderItems = new Map(
      itemResult.rows.map(item => [String(item.product_id), item])
    );

    for (const item of items) {
      const existingItem = orderItems.get(String(item.product_id));

      if (!existingItem) {
        throw new Error(`Product ${item.product_id} does not belong to this order`);
      }

      if (
        Number(existingItem.received_qty) + Number(item.received_qty) >
        Number(existingItem.ordered_qty)
      ) {
        throw new Error(
          `Received quantity exceeds ordered quantity for product ${item.product_id}`
        );
      }
    }

    await client.query(
      "SELECT set_config('stockvault.change_reason', 'PURCHASE_RECEIPT', TRUE)"
    );

    for (const item of items) {
      const productId = Number(item.product_id);
      const receivedQty = Number(item.received_qty);

      const stockResult = await client.query(
        `SELECT qty_on_hand
         FROM stockvault.warehouse_stock
         WHERE warehouse_id = $1 AND product_id = $2
         FOR UPDATE`,
        [order.warehouse_id, productId]
      );

      if (stockResult.rowCount > 0) {
        await client.query(
          `UPDATE stockvault.warehouse_stock
           SET qty_on_hand = qty_on_hand + $1
           WHERE warehouse_id = $2 AND product_id = $3`,
          [receivedQty, order.warehouse_id, productId]
        );
      } else {
        await client.query(
          `INSERT INTO stockvault.warehouse_stock
           (warehouse_id, product_id, qty_on_hand)
           VALUES ($1, $2, $3)`,
          [order.warehouse_id, productId, receivedQty]
        );

        await client.query(
          `INSERT INTO stockvault.stock_audit_log
           (warehouse_id, product_id, old_qty, new_qty, change_reason)
           VALUES ($1, $2, 0, $3, 'PURCHASE_RECEIPT')`,
          [order.warehouse_id, productId, receivedQty]
        );
      }

      await client.query(
        `UPDATE stockvault.purchase_order_item
         SET received_qty = received_qty + $1
         WHERE po_id = $2 AND product_id = $3`,
        [receivedQty, order.po_id, productId]
      );
    }

    const remainingResult = await client.query(
      `SELECT COUNT(*)::INTEGER AS remaining
       FROM stockvault.purchase_order_item
       WHERE po_id = $1 AND received_qty < ordered_qty`,
      [order.po_id]
    );

    const fullyReceived = remainingResult.rows[0].remaining === 0;

    const updatedOrder = await client.query(
      `UPDATE stockvault.purchase_order
       SET status = CASE WHEN $1 THEN 'RECEIVED' ELSE 'APPROVED' END,
           received_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE po_id = $2
       RETURNING *`,
      [fullyReceived, order.po_id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: fullyReceived
        ? "Purchase order fully received"
        : "Stock received successfully. Remaining quantities are pending.",
      data: updatedOrder.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Receive stock error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to receive stock"
    });
  } finally {
    client.release();
  }
});
module.exports = router;


