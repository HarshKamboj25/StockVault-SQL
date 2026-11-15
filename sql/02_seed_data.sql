SET search_path TO stockvault, public;
INSERT INTO category(name) VALUES ('Electronics'), ('Accessories'), ('Office Supplies');
INSERT INTO category(name, parent_category_id)
SELECT 'Keyboards', category_id FROM category WHERE name='Accessories';
INSERT INTO supplier(name,email,phone,avg_lead_days,rating) VALUES
('NorthStar Supplies','northstar@example.com','+91-9000000001',5,4.5),
('Metro Wholesale','metro@example.com','+91-9000000002',8,4.1),
('Apex Components','apex@example.com','+91-9000000003',4,4.8);
INSERT INTO warehouse(code,name,city,capacity_units) VALUES
('WH-DEL-01','Delhi Central Warehouse','Delhi',5000),
('WH-GGN-01','Gurugram Distribution Hub','Gurugram',3500),
('WH-NOI-01','Noida Storage Center','Noida',2500);
INSERT INTO product(sku,name,category_id,unit_price,reorder_threshold)
SELECT 'KB-001','Mechanical Keyboard',category_id,2499,10 FROM category WHERE name='Keyboards';
INSERT INTO product(sku,name,category_id,unit_price,reorder_threshold)
SELECT 'MS-001','Wireless Mouse',category_id,899,15 FROM category WHERE name='Accessories';
INSERT INTO product(sku,name,category_id,unit_price,reorder_threshold)
SELECT 'MON-001','24-inch Monitor',category_id,10999,5 FROM category WHERE name='Electronics';
INSERT INTO product(sku,name,category_id,unit_price,reorder_threshold)
SELECT 'NB-001','Notebook Pack',category_id,199,20 FROM category WHERE name='Office Supplies';
INSERT INTO warehouse_stock(warehouse_id,product_id,qty_on_hand,bin_location)
SELECT w.warehouse_id,p.product_id,v.qty,v.bin
FROM (VALUES
 ('WH-DEL-01','KB-001',7,'A-01'),('WH-DEL-01','MS-001',42,'A-02'),
 ('WH-DEL-01','MON-001',8,'B-01'),('WH-DEL-01','NB-001',16,'C-01'),
 ('WH-GGN-01','KB-001',18,'A-04'),('WH-GGN-01','MS-001',9,'A-05'),
 ('WH-GGN-01','MON-001',3,'B-02'),('WH-NOI-01','KB-001',12,'A-01'),
 ('WH-NOI-01','NB-001',35,'C-02')
) v(warehouse_code,sku,qty,bin)
JOIN warehouse w ON w.code=v.warehouse_code
JOIN product p ON p.sku=v.sku;
INSERT INTO purchase_order(po_number,supplier_id,warehouse_id,status)
SELECT 'PO-1001',s.supplier_id,w.warehouse_id,'DRAFT'
FROM supplier s CROSS JOIN warehouse w
WHERE s.name='NorthStar Supplies' AND w.code='WH-DEL-01';
INSERT INTO purchase_order_item(po_id,product_id,ordered_qty,unit_price)
SELECT po.po_id,p.product_id,30,p.unit_price
FROM purchase_order po JOIN product p ON p.sku='KB-001'
WHERE po.po_number='PO-1001';
SELECT 'Seed data inserted' AS result;
