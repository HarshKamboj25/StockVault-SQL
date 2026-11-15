const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const dashboardRoutes = require("./routes/dashboardRoutes");
const productRoutes = require("./routes/productRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const alertRoutes = require("./routes/alertRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const transferRoutes = require("./routes/transferRoutes");
const reportRoutes = require("./routes/reportRoutes");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.json({ message: "StockVault API is running!" });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database() AS database, current_schema() AS schema, NOW() AS server_time");
    res.json({
      success: true,
      message: "StockVault database connected successfully!",
      database: result.rows[0].database,
      schema: result.rows[0].schema,
      serverTime: result.rows[0].server_time
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StockVault API running on http://localhost:${PORT}`);
});

