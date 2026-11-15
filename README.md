# StockVault SQL
**DBMS Capstone | Smart Commerce & Multi-Warehouse Inventory Management**

StockVault SQL is a database-first RDBMS project built using PostgreSQL 16+. It manages products, categories, suppliers, warehouses, inventory, purchase orders and stock transfers.

The project demonstrates ER modelling, relational database design, normalization concepts, SQL queries, joins, subqueries, CTEs, window functions, views, indexes, transactions, PL/pgSQL functions, stored procedures, triggers, cursors, database security, query optimization and data warehouse analytics.

## Technology Stack
- Database: PostgreSQL 16+
- Database administration: pgAdmin 4 (optional)
- SQL: PostgreSQL SQL and PL/pgSQL
- Environment: Windows PowerShell and VS Code Terminal

## Project Structure
- docs/
- sql/
  - 01_schema.sql
  - 02_seed_data.sql
  - 03_queries.sql
  - 04_views_indexes.sql
  - 05_transactions.sql
  - 06_security.sql
  - 07_performance.sql
  - 08_analytics_star_schema.sql
- outputs/
- README.md
- .gitignore

## Database Setup
1. Install PostgreSQL 16 or later.
2. Ensure the PostgreSQL service is running.
3. Open this project folder in VS Code.
4. Open a PowerShell terminal in the project root.
5. Create the dedicated database:

    createdb -h localhost -U postgres stockvault_db

## Running SQL Scripts

Run the following commands in numerical order:

    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\01_schema.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\02_seed_data.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\03_queries.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\04_views_indexes.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\05_transactions.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\07_performance.sql
    psql -h localhost -U postgres -d stockvault_db -v ON_ERROR_STOP=1 -f .\sql\08_analytics_star_schema.sql

Enter the PostgreSQL password whenever prompted.

### Important Safety Notes
- The 01_schema.sql script drops and recreates the stockvault schema. Run it only in the dedicated stockvault_db database.
- Run 02_seed_data.sql only once after schema creation, unless the database has been reset.
- The 06_security.sql original role-creation DO block should not be executed as-is. In this implementation, roles were created separately and permissions were granted using administrator commands.
- Replace example role passwords with private passwords before sharing the project. Never publish real credentials.

## Project Workflow
1. Maintain product categories and product information.
2. Register suppliers and warehouses.
3. Track stock quantities across multiple warehouses.
4. Create purchase orders and line items.
5. Monitor stock levels and reorder requirements.
6. Transfer inventory between warehouses.
7. Maintain audit history for stock changes.
8. Generate inventory valuation and analytical reports.

## Main Database Modules
| Module | Purpose |
|---|---|
| Product Management | Store product and category information |
| Supplier Management | Maintain supplier records |
| Warehouse Management | Manage multiple storage locations |
| Inventory Management | Track warehouse-wise stock |
| Purchase Orders | Manage purchase orders and items |
| Stock Transfers | Demonstrate inventory movement |
| Audit System | Maintain stock change history |
| Analytics | Generate warehouse and category reports |
| Security | Demonstrate database roles and privileges |

## SQL Concepts Demonstrated
- DDL and DML
- Primary keys and foreign keys
- Constraints and relationships
- Joins and aggregate functions
- Subqueries and set operations
- Common Table Expressions and recursive CTEs
- Window functions
- Views and indexes
- Transactions, COMMIT, ROLLBACK and SAVEPOINT
- PL/pgSQL functions and stored procedures
- Explicit cursor demonstration
- Triggers and audit logging
- GRANT and REVOKE concepts
- EXPLAIN ANALYZE
- ETL and star-schema analytics

## Data Warehouse and Analytics
The project includes a small analytical star schema:
- dim_date
- dim_product
- dim_warehouse
- fact_stock_snapshot

It demonstrates reporting by warehouse, product category, stock quantity and inventory value.

### Verified Business Routine Results
- Inventory valuation function tested for all three warehouses.
- Stock transfer function tested inside a transaction; the transaction was rolled back, preserving inventory.
- Reorder alert procedure executed successfully and generated three alerts.
- Transaction and savepoint demonstrations in 05_transactions.sql roll back their changes to keep repeated execution non-destructive.

## Verified Implementation
| Verification | Result |
|---|---:|
| Tables and views listed in stockvault schema | 17 |
| Products | 4 |
| Warehouses | 3 |
| Warehouse stock records | 9 |
| SQL script files | 8 |
| Total stock units | 154 |
| Total inventory valuation | 279,446.00 |
| Reorder alerts generated | 3 |
| Warehouses with inventory valuation | 3 |
| Tested business routines | 3 |

## Syllabus Mapping
**Unit 1**
- ER model and relationships
- Keys and constraints
- Normalization concepts
- Relational database design
- Star schema

**Unit 2**
- DDL and DML
- Joins and subqueries
- Set operations
- Views and indexes
- CTEs and window functions

**Unit 3**
- ACID properties and TCL
- Transactions and savepoints
- Functions and stored procedures
- Explicit cursors
- Triggers
- Database roles and privileges

**Unit 4**
- Query optimization
- EXPLAIN ANALYZE
- B-tree indexes
- ETL concepts
- Data warehousing and star schema

The MongoDB social-media practical is a separate NoSQL exercise and is not part of this PostgreSQL RDBMS project.

## Demo and Evaluation Checklist
- Explain the ER diagram and database relationships.
- Discuss normalization and constraints.
- Demonstrate inventory queries, joins and window functions.
- Show views and indexes.
- Demonstrate transaction rollback and savepoints.
- Explain the stock-transfer function and stored procedure.
- Inspect audit records and trigger behaviour.
- Demonstrate role-based database permissions.
- Compare query plans using EXPLAIN ANALYZE.
- Display the star-schema analytical report.

## Project Scope
StockVault SQL is a pure database management system project, not a web application. Frontend development, payment gateways, Redis and microservices are outside the scope of this DBMS capstone.

**Project:** StockVault SQL  
**Category:** DBMS Capstone  
**Database:** PostgreSQL 16+



