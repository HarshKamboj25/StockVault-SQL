# Relational Design & Normalization
Example functional dependencies:
- product_id -> sku, name, category_id, unit_price, reorder_threshold
- warehouse_id -> code, name, city, capacity_units
- supplier_id -> name, email, phone, avg_lead_days
- (warehouse_id, product_id) -> qty_on_hand, bin_location, updated_at
- po_id -> po_number, supplier_id, warehouse_id, status, created_at

1NF: columns contain atomic values; stock per warehouse is stored as rows.
2NF: warehouse_stock attributes depend on the complete composite key.
3NF: supplier and category details are stored in their own relations, avoiding repeated transitive details.
Discuss BCNF against the listed functional dependencies in your report rather than claiming it without explanation.

Money uses NUMERIC, quantities use integer CHECK constraints. Purchase-order line items preserve ordered quantity and unit price at order time.
