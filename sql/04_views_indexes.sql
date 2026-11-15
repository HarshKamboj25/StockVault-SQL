SET search_path TO stockvault, public;
CREATE OR REPLACE VIEW vw_product_stock_summary AS
SELECT p.product_id,p.sku,p.name,c.name AS category,
 COALESCE(SUM(ws.qty_on_hand),0) AS total_units,p.unit_price,
 COALESCE(SUM(ws.qty_on_hand*p.unit_price),0) AS total_stock_value
FROM product p JOIN category c USING(category_id)
LEFT JOIN warehouse_stock ws USING(product_id)
GROUP BY p.product_id,p.sku,p.name,c.name,p.unit_price;
CREATE OR REPLACE VIEW vw_supplier_purchase_summary AS
SELECT s.supplier_id,s.name,COUNT(po.po_id) AS purchase_order_count
FROM supplier s LEFT JOIN purchase_order po USING(supplier_id)
GROUP BY s.supplier_id,s.name;
CREATE INDEX IF NOT EXISTS idx_product_name ON product(name);
CREATE INDEX IF NOT EXISTS idx_product_category_price ON product(category_id,unit_price);
CREATE INDEX IF NOT EXISTS idx_stock_qty ON warehouse_stock(qty_on_hand);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_order(created_at DESC);
SELECT * FROM vw_product_stock_summary;
SELECT * FROM vw_low_stock;
