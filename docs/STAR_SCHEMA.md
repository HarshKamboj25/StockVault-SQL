# StockVault SQL - Star Schema Diagram

```mermaid
erDiagram
    DIM_DATE ||--o{ FACT_STOCK_SNAPSHOT : records
    DIM_WAREHOUSE ||--o{ FACT_STOCK_SNAPSHOT : tracks
    DIM_PRODUCT ||--o{ FACT_STOCK_SNAPSHOT : measures
    DIM_DATE {
        int date_key PK
        date full_date
        int year_no
        int month_no
        varchar month_name
    }
    DIM_WAREHOUSE {
        bigint warehouse_key PK
        bigint warehouse_id UK
        varchar warehouse_code
        varchar warehouse_name
        varchar city
    }
    DIM_PRODUCT {
        bigint product_key PK
        bigint product_id UK
        varchar sku
        varchar product_name
        varchar category_name
    }
    FACT_STOCK_SNAPSHOT {
        bigint snapshot_key PK
        int date_key FK
        bigint warehouse_key FK
        bigint product_key FK
        int quantity_on_hand
        numeric inventory_value
    }
```

## Explanation

The fact_stock_snapshot table stores inventory snapshot measurements. It references three dimension tables: dim_date, dim_warehouse and dim_product.

The measures are quantity_on_hand and inventory_value. The dimensions provide the date, warehouse and product context for analytical reporting.
