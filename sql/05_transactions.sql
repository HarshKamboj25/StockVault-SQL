SET search_path TO stockvault, public;
-- TCL demo: run and observe rollback.
BEGIN;
UPDATE warehouse_stock SET qty_on_hand=qty_on_hand+5
WHERE warehouse_id=(SELECT warehouse_id FROM warehouse WHERE code='WH-DEL-01')
AND product_id=(SELECT product_id FROM product WHERE sku='KB-001');
ROLLBACK;
-- SAVEPOINT demo
BEGIN;
UPDATE warehouse_stock SET qty_on_hand=qty_on_hand+2
WHERE warehouse_id=(SELECT warehouse_id FROM warehouse WHERE code='WH-DEL-01')
AND product_id=(SELECT product_id FROM product WHERE sku='KB-001');
SAVEPOINT after_first_update;
UPDATE warehouse_stock SET qty_on_hand=qty_on_hand+100
WHERE warehouse_id=(SELECT warehouse_id FROM warehouse WHERE code='WH-DEL-01')
AND product_id=(SELECT product_id FROM product WHERE sku='KB-001');
ROLLBACK TO SAVEPOINT after_first_update;
-- Roll back the outer transaction to keep this demo non-destructive.
ROLLBACK;

CREATE OR REPLACE FUNCTION stockvault.fn_warehouse_inventory_value(p_warehouse_id BIGINT)
RETURNS NUMERIC(14,2) LANGUAGE SQL SET search_path = stockvault, public AS $$
 SELECT COALESCE(SUM(ws.qty_on_hand*p.unit_price),0)::NUMERIC(14,2)
 FROM stockvault.warehouse_stock ws JOIN stockvault.product p USING(product_id)
 WHERE ws.warehouse_id=p_warehouse_id;
$$;

CREATE OR REPLACE FUNCTION stockvault.fn_transfer_stock(
 p_from_warehouse BIGINT,p_to_warehouse BIGINT,p_product BIGINT,p_quantity INTEGER
) RETURNS BIGINT LANGUAGE plpgsql SET search_path = stockvault, public AS $$
DECLARE v_source_qty INTEGER; v_transfer_id BIGINT;
BEGIN
 IF p_quantity<=0 THEN RAISE EXCEPTION 'Transfer quantity must be positive'; END IF;
 IF p_from_warehouse=p_to_warehouse THEN RAISE EXCEPTION 'Warehouses must differ'; END IF;
 SELECT qty_on_hand INTO v_source_qty FROM warehouse_stock
 WHERE warehouse_id=p_from_warehouse AND product_id=p_product FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Source stock row does not exist'; END IF;
 IF v_source_qty<p_quantity THEN
  RAISE EXCEPTION 'Insufficient stock: available %, requested %',v_source_qty,p_quantity;
 END IF;
 PERFORM set_config('stockvault.change_reason','TRANSFER_OUT',TRUE);
 UPDATE warehouse_stock SET qty_on_hand=qty_on_hand-p_quantity
 WHERE warehouse_id=p_from_warehouse AND product_id=p_product;
 INSERT INTO warehouse_stock(warehouse_id,product_id,qty_on_hand)
 VALUES(p_to_warehouse,p_product,p_quantity)
 ON CONFLICT(warehouse_id,product_id)
 DO UPDATE SET qty_on_hand=warehouse_stock.qty_on_hand+EXCLUDED.qty_on_hand;
 INSERT INTO stock_transfer(from_warehouse_id,to_warehouse_id,product_id,quantity)
 VALUES(p_from_warehouse,p_to_warehouse,p_product,p_quantity)
 RETURNING transfer_id INTO v_transfer_id;
 RETURN v_transfer_id;
END; $$;

CREATE TABLE IF NOT EXISTS stockvault.reorder_alert(
 alert_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 warehouse_id BIGINT NOT NULL REFERENCES stockvault.warehouse(warehouse_id),
 product_id BIGINT NOT NULL REFERENCES stockvault.product(product_id),
 current_qty INTEGER NOT NULL,reorder_threshold INTEGER NOT NULL,
 generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE PROCEDURE stockvault.sp_generate_reorder_alerts()
LANGUAGE plpgsql SET search_path = stockvault, public AS $$
DECLARE stock_cursor CURSOR FOR
 SELECT ws.warehouse_id,ws.product_id,ws.qty_on_hand,p.reorder_threshold
 FROM stockvault.warehouse_stock ws JOIN stockvault.product p USING(product_id)
 WHERE ws.qty_on_hand<=p.reorder_threshold;
 r RECORD;
BEGIN
 DELETE FROM reorder_alert;
 OPEN stock_cursor;
 LOOP
  FETCH stock_cursor INTO r;
  EXIT WHEN NOT FOUND;
  INSERT INTO reorder_alert(warehouse_id,product_id,current_qty,reorder_threshold)
  VALUES(r.warehouse_id,r.product_id,r.qty_on_hand,r.reorder_threshold);
 END LOOP;
 CLOSE stock_cursor;
END; $$;

-- Try separately:
-- SELECT stockvault.fn_warehouse_inventory_value(1);
-- SELECT stockvault.fn_transfer_stock(1,2,1,2);
-- CALL stockvault.sp_generate_reorder_alerts();
-- SELECT * FROM reorder_alert;
-- SELECT * FROM stock_audit_log ORDER BY changed_at DESC;



