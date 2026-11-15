-- PostgreSQL 16+ | Run in database stockvault_db
DROP SCHEMA IF EXISTS stockvault CASCADE;
CREATE SCHEMA stockvault;
SET search_path TO stockvault, public;

CREATE TABLE category (
 category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name VARCHAR(80) NOT NULL UNIQUE,
 parent_category_id BIGINT REFERENCES category(category_id)
);
CREATE TABLE supplier (
 supplier_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(160) UNIQUE,
 phone VARCHAR(25),
 avg_lead_days INTEGER NOT NULL DEFAULT 7 CHECK (avg_lead_days >= 0),
 rating NUMERIC(2,1) CHECK (rating BETWEEN 1 AND 5),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE warehouse (
 warehouse_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code VARCHAR(20) NOT NULL UNIQUE,
 name VARCHAR(120) NOT NULL,
 city VARCHAR(80) NOT NULL,
 capacity_units INTEGER NOT NULL DEFAULT 0 CHECK (capacity_units >= 0),
 is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE product (
 product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 sku VARCHAR(40) NOT NULL UNIQUE,
 name VARCHAR(160) NOT NULL,
 category_id BIGINT NOT NULL REFERENCES category(category_id),
 unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
 reorder_threshold INTEGER NOT NULL DEFAULT 5 CHECK (reorder_threshold >= 0),
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE warehouse_stock (
 warehouse_id BIGINT NOT NULL REFERENCES warehouse(warehouse_id),
 product_id BIGINT NOT NULL REFERENCES product(product_id),
 qty_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
 bin_location VARCHAR(30),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (warehouse_id, product_id)
);
CREATE TABLE purchase_order (
 po_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 po_number VARCHAR(30) NOT NULL UNIQUE,
 supplier_id BIGINT NOT NULL REFERENCES supplier(supplier_id),
 warehouse_id BIGINT NOT NULL REFERENCES warehouse(warehouse_id),
 status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
   CHECK (status IN ('DRAFT','APPROVED','RECEIVED','CANCELLED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 received_at TIMESTAMPTZ
);
CREATE TABLE purchase_order_item (
 po_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 po_id BIGINT NOT NULL REFERENCES purchase_order(po_id) ON DELETE CASCADE,
 product_id BIGINT NOT NULL REFERENCES product(product_id),
 ordered_qty INTEGER NOT NULL CHECK (ordered_qty > 0),
 received_qty INTEGER NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
 unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
 CHECK (received_qty <= ordered_qty),
 UNIQUE (po_id, product_id)
);
CREATE TABLE stock_transfer (
 transfer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 from_warehouse_id BIGINT NOT NULL REFERENCES warehouse(warehouse_id),
 to_warehouse_id BIGINT NOT NULL REFERENCES warehouse(warehouse_id),
 product_id BIGINT NOT NULL REFERENCES product(product_id),
 quantity INTEGER NOT NULL CHECK (quantity > 0),
 status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
   CHECK (status IN ('PENDING','COMPLETED','CANCELLED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (from_warehouse_id <> to_warehouse_id)
);
CREATE TABLE stock_audit_log (
 audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 warehouse_id BIGINT NOT NULL,
 product_id BIGINT NOT NULL,
 old_qty INTEGER NOT NULL,
 new_qty INTEGER NOT NULL,
 change_reason VARCHAR(40) NOT NULL,
 changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_po_supplier_created ON purchase_order(supplier_id, created_at DESC);
CREATE INDEX idx_po_status ON purchase_order(status);
CREATE INDEX idx_stock_product ON warehouse_stock(product_id);

CREATE OR REPLACE FUNCTION fn_audit_stock_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.qty_on_hand IS DISTINCT FROM OLD.qty_on_hand THEN
  INSERT INTO stock_audit_log(warehouse_id, product_id, old_qty, new_qty, change_reason)
  VALUES (NEW.warehouse_id, NEW.product_id, OLD.qty_on_hand, NEW.qty_on_hand,
          COALESCE(current_setting('stockvault.change_reason', TRUE), 'MANUAL_UPDATE'));
 END IF;
 NEW.updated_at := CURRENT_TIMESTAMP;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_stock_audit
BEFORE UPDATE ON warehouse_stock
FOR EACH ROW EXECUTE FUNCTION fn_audit_stock_change();

CREATE OR REPLACE VIEW vw_low_stock AS
SELECT w.code AS warehouse_code, w.name AS warehouse_name,
       p.sku, p.name AS product_name, ws.qty_on_hand, p.reorder_threshold
FROM warehouse_stock ws
JOIN warehouse w USING (warehouse_id)
JOIN product p USING (product_id)
WHERE ws.qty_on_hand <= p.reorder_threshold;
