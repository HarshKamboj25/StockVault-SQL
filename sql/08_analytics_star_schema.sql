SET search_path TO stockvault,public;
CREATE TABLE IF NOT EXISTS dim_date(
 date_key INTEGER PRIMARY KEY,full_date DATE NOT NULL UNIQUE,
 year_no INTEGER NOT NULL,month_no INTEGER NOT NULL,month_name VARCHAR(15) NOT NULL
);
CREATE TABLE IF NOT EXISTS dim_warehouse(
 warehouse_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 warehouse_id BIGINT NOT NULL UNIQUE,warehouse_code VARCHAR(20) NOT NULL,
 warehouse_name VARCHAR(120) NOT NULL,city VARCHAR(80) NOT NULL
);
CREATE TABLE IF NOT EXISTS dim_product(
 product_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_id BIGINT NOT NULL UNIQUE,sku VARCHAR(40) NOT NULL,
 product_name VARCHAR(160) NOT NULL,category_name VARCHAR(80) NOT NULL
);
CREATE TABLE IF NOT EXISTS fact_stock_snapshot(
 snapshot_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 date_key INTEGER NOT NULL REFERENCES dim_date(date_key),
 warehouse_key BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_key),
 product_key BIGINT NOT NULL REFERENCES dim_product(product_key),
 quantity_on_hand INTEGER NOT NULL,inventory_value NUMERIC(14,2) NOT NULL
);
INSERT INTO dim_warehouse(warehouse_id,warehouse_code,warehouse_name,city)
SELECT warehouse_id,code,name,city FROM warehouse
ON CONFLICT(warehouse_id) DO UPDATE SET warehouse_code=EXCLUDED.warehouse_code,
 warehouse_name=EXCLUDED.warehouse_name,city=EXCLUDED.city;
INSERT INTO dim_product(product_id,sku,product_name,category_name)
SELECT p.product_id,p.sku,p.name,c.name FROM product p JOIN category c USING(category_id)
ON CONFLICT(product_id) DO UPDATE SET sku=EXCLUDED.sku,
 product_name=EXCLUDED.product_name,category_name=EXCLUDED.category_name;
INSERT INTO dim_date(date_key,full_date,year_no,month_no,month_name)
VALUES(TO_CHAR(CURRENT_DATE,'YYYYMMDD')::INTEGER,CURRENT_DATE,
 EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
 TO_CHAR(CURRENT_DATE,'Month'))
ON CONFLICT(date_key) DO NOTHING;
DELETE FROM fact_stock_snapshot WHERE date_key=TO_CHAR(CURRENT_DATE,'YYYYMMDD')::INTEGER;
INSERT INTO fact_stock_snapshot(date_key,warehouse_key,product_key,quantity_on_hand,inventory_value)
SELECT TO_CHAR(CURRENT_DATE,'YYYYMMDD')::INTEGER,dw.warehouse_key,dp.product_key,
 ws.qty_on_hand,(ws.qty_on_hand*p.unit_price)::NUMERIC(14,2)
FROM warehouse_stock ws JOIN product p USING(product_id)
JOIN dim_warehouse dw USING(warehouse_id) JOIN dim_product dp USING(product_id);
SELECT dw.warehouse_name,dp.category_name,SUM(f.quantity_on_hand) AS total_units,
 SUM(f.inventory_value) AS total_inventory_value
FROM fact_stock_snapshot f JOIN dim_warehouse dw USING(warehouse_key)
JOIN dim_product dp USING(product_key)
GROUP BY dw.warehouse_name,dp.category_name ORDER BY total_inventory_value DESC;
