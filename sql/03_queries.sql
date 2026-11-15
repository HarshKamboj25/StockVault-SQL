SET search_path TO stockvault, public;
-- INNER JOIN
SELECT w.name AS warehouse,p.sku,p.name AS product,ws.qty_on_hand
FROM warehouse_stock ws JOIN warehouse w USING(warehouse_id)
JOIN product p USING(product_id) ORDER BY w.name,p.name;
-- LEFT JOIN
SELECT p.sku,p.name,COALESCE(SUM(ws.qty_on_hand),0) AS total_stock
FROM product p LEFT JOIN warehouse_stock ws USING(product_id)
GROUP BY p.product_id,p.sku,p.name ORDER BY total_stock;
-- SELF JOIN: category hierarchy
SELECT child.name,parent.name AS parent_category
FROM category child LEFT JOIN category parent
ON child.parent_category_id=parent.category_id;
-- Subquery
SELECT sku,name,unit_price FROM product
WHERE unit_price>(SELECT AVG(unit_price) FROM product);
-- Correlated EXISTS
SELECT w.code,w.name FROM warehouse w
WHERE EXISTS (SELECT 1 FROM warehouse_stock ws JOIN product p USING(product_id)
 WHERE ws.warehouse_id=w.warehouse_id AND ws.qty_on_hand<=p.reorder_threshold);
-- Set operation
(SELECT p.sku FROM product p JOIN warehouse_stock ws USING(product_id)
 WHERE ws.qty_on_hand<=p.reorder_threshold)
UNION
(SELECT sku FROM product WHERE unit_price>=5000);
-- CTE
WITH warehouse_value AS (
 SELECT w.warehouse_id,w.name,SUM(ws.qty_on_hand*p.unit_price) AS stock_value
 FROM warehouse w JOIN warehouse_stock ws USING(warehouse_id)
 JOIN product p USING(product_id) GROUP BY w.warehouse_id,w.name
) SELECT * FROM warehouse_value ORDER BY stock_value DESC;
-- Recursive CTE
WITH RECURSIVE category_tree AS (
 SELECT category_id,name,parent_category_id,0 AS depth FROM category WHERE parent_category_id IS NULL
 UNION ALL
 SELECT c.category_id,c.name,c.parent_category_id,ct.depth+1
 FROM category c JOIN category_tree ct ON c.parent_category_id=ct.category_id
) SELECT * FROM category_tree ORDER BY depth,name;
-- Window function
SELECT p.sku,p.name,SUM(ws.qty_on_hand) AS total_units,
 SUM(ws.qty_on_hand*p.unit_price) AS inventory_value,
 RANK() OVER(ORDER BY SUM(ws.qty_on_hand*p.unit_price) DESC) AS value_rank
FROM product p JOIN warehouse_stock ws USING(product_id)
GROUP BY p.product_id,p.sku,p.name ORDER BY value_rank;
-- Running total window function
SELECT w.name AS warehouse,p.sku,
 ws.qty_on_hand*p.unit_price AS line_value,
 SUM(ws.qty_on_hand*p.unit_price) OVER(PARTITION BY w.warehouse_id ORDER BY p.sku) AS running_value
FROM warehouse_stock ws JOIN warehouse w USING(warehouse_id)
JOIN product p USING(product_id) ORDER BY warehouse,p.sku;
