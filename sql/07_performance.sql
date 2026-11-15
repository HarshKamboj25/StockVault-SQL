SET search_path TO stockvault,public;
-- Capture this plan before adding the index.
EXPLAIN ANALYZE SELECT * FROM product WHERE name='Mechanical Keyboard';
CREATE INDEX IF NOT EXISTS idx_product_name_performance ON product(name);
ANALYZE product;
-- Compare the plan after indexing. Small tables may still use a sequential scan.
EXPLAIN ANALYZE SELECT * FROM product WHERE name='Mechanical Keyboard';
EXPLAIN ANALYZE SELECT * FROM purchase_order
WHERE status='DRAFT' ORDER BY created_at DESC;
