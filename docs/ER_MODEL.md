# ER Model
Entities: category, product, supplier, warehouse, warehouse_stock, purchase_order, purchase_order_item, stock_transfer, stock_audit_log.

Relationships:
- One category has many products; category can have child categories.
- Products and warehouses are many-to-many through warehouse_stock.
- One supplier has many purchase orders.
- One warehouse receives many purchase orders.
- One purchase order has many purchase_order_items.
- Products can appear in many purchase_order_items and stock transfers.
- Stock audit rows record quantity changes.

Use crow's-foot notation in dbdiagram.io or Lucidchart. Mark PKs, FKs, UNIQUE and CHECK constraints. `warehouse_stock` has composite PK `(warehouse_id, product_id)`.
