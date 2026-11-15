import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  FileBarChart, Package, Boxes, Coins, Warehouse,
  Truck, ShoppingCart, ArrowLeftRight, AlertTriangle,
  RefreshCw, TrendingUp
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const COLORS = ["#07965b", "#3985d6", "#e9a23b", "#8b75cf", "#e16c6c"];

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  });

const number = (value) => Number(value || 0).toLocaleString("en-IN");

function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const loadReports = async () => {
    const startTime = Date.now();

    try {
      setLoading(true);
      setShowSkeleton(true);
      setError("");

      const response = await axios.get(`${API}/reports`, {
        params: { refresh: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
      });

      if (response.data.success) {
        setData(response.data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      setError("Unable to load reports. Please check the backend connection.");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1500 - elapsed);

      await new Promise(resolve => setTimeout(resolve, remaining));
      setLoading(false);
      setShowSkeleton(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;

    const records = [
      ...warehouseData.map((item) => ({ report_section: "Warehouse Performance", ...item })),
      ...supplierData.map((item) => ({ report_section: "Supplier Performance", ...item })),
      ...orderData.map((item) => ({ report_section: "Purchase Order Analytics", ...item })),
      ...movementData.map((item) => ({ report_section: "Stock Movements", ...item })),
      ...alertData.map((item) => ({ report_section: "Low Stock Alerts", ...item })),
      { report_section: "Inventory Summary", ...inventory }
    ];

    const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      columns.map(escapeCSV).join(","),
      ...records.map((record) =>
        columns.map((column) => escapeCSV(record[column])).join(",")
      )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StockVault_Reports_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    loadReports();
  }, []);

  if (loading && !data) {
    return <div className="reports-loading">Generating your business reports...</div>;
  }

  if (error && !data) {
    return (
      <div className="reports-error">
        <AlertTriangle size={22} />
        <p>{error}</p>
        <button onClick={loadReports}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const inventory = data.inventory || {};
  const warehouseData = data.warehouses || [];
  const supplierData = data.suppliers || [];
  const orderData = data.purchaseOrders || [];
  const movementData = data.movements || [];
  const alertData = data.lowStock || [];

  const metrics = [
    { label: "Total Products", value: number(inventory.total_products), note: `${number(inventory.active_products)} active products`, icon: Package },
    { label: "Stock Units", value: number(inventory.total_stock_units), note: "Across all warehouses", icon: Boxes },
    { label: "Inventory Value", value: money(inventory.inventory_value), note: "Current stock valuation", icon: Coins },
    { label: "Warehouses", value: number(warehouseData.length), note: "Reporting locations", icon: Warehouse },
    { label: "Suppliers", value: number(supplierData.length), note: "Registered suppliers", icon: Truck },
    { label: "Low-Stock Alerts", value: number(alertData.length), note: "Require replenishment", icon: AlertTriangle }
  ];

  return (
    <div className="reports-page">
      <section className="page-heading reports-heading">
        <div>
          <div className="eyebrow">BUSINESS INTELLIGENCE</div>
          <h1>Reports & Analytics <span>?</span></h1>
          <p>Understand your inventory performance with live database insights.</p>
          <small className="reports-last-updated">{lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString("en-IN")}` : "Waiting for first refresh..."}</small>
        </div>
        <div className="reports-header-actions"><button className="reports-export" onClick={exportCSV}>Export CSV</button><button className="reports-refresh" onClick={loadReports} disabled={loading}>
          <RefreshCw size={16} className={loading ? "reports-spinning" : ""} /> {loading ? "Refreshing..." : "Refresh Reports"}
        </button></div>
</section>

      {error && <div className="reports-inline-error">{error}</div>}

      {showSkeleton ? (
        <div className="reports-skeleton-content">
          <section className="reports-metrics">
            {Array.from({ length: 6 }).map((_, i) => (
              <article className="report-skeleton-card report-reveal" key={i}
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="report-skeleton report-skeleton-icon" />
                <div className="report-skeleton report-skeleton-line" />
                <div className="report-skeleton report-skeleton-value" />
              </article>
            ))}
          </section>

          <section className="reports-chart-grid">
            {[1, 2].map((item, i) => (
              <article className="panel report-panel" key={item}>
                <div className="report-skeleton report-skeleton-line" />
                <div className="report-skeleton report-skeleton-chart"
                  style={{ marginTop: 24, animationDelay: `${i * 120}ms` }} />
              </article>
            ))}
          </section>

          {[1, 2, 3].map((item) => (
            <section className="panel report-panel" key={item}>
              <div className="report-skeleton report-skeleton-line" />
              {[1, 2, 3, 4].map((row) => (
                <div className="report-skeleton report-skeleton-line"
                  key={row} style={{ width: "100%", height: 18, marginTop: 18 }} />
              ))}
            </section>
          ))}
        </div>
      ) : (
        <>
      <section className="reports-metrics">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article className="report-metric-card" key={label}>
            <div className="report-metric-icon"><Icon size={19} /></div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="reports-chart-grid">
        <article className="panel report-panel">
          <div className="panel-heading">
            <div><h2>Warehouse Performance</h2><p>Stock distribution by location</p></div>
            <Warehouse className="heading-green" size={20} />
          </div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseData} margin={{ top: 12, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid stroke="#edf1ef" vertical={false} />
                <XAxis dataKey="city" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => number(value)} />
                <Bar dataKey="stock_units" name="Stock Units" fill="#07965b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel report-panel">
          <div className="panel-heading">
            <div><h2>Purchase Order Status</h2><p>Orders grouped by current status</p></div>
            <ShoppingCart className="heading-green" size={20} />
          </div>
          <div className="report-chart">
            {orderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderData} dataKey="order_count" nameKey="status" cx="50%" cy="45%" outerRadius={90} innerRadius={52} paddingAngle={4}>
                    {orderData.map((entry, index) => (
                      <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No purchase order data available.</div>}
          </div>
        </article>
      </section>

      <section className="panel report-panel report-valuation">
        <div className="panel-heading">
          <div><h2>Warehouse Valuation</h2><p>Inventory worth and product coverage by location</p></div>
          <TrendingUp className="heading-green" size={20} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>WAREHOUSE</th><th>CODE</th><th>CITY</th><th>PRODUCT TYPES</th><th>STOCK UNITS</th><th>INVENTORY VALUE</th></tr></thead>
            <tbody>
              {warehouseData.map((w) => (
                <tr key={w.warehouse_id}>
                  <td><strong>{w.warehouse_name}</strong></td>
                  <td className="sku-cell">{w.code}</td>
                  <td>{w.city}</td>
                  <td>{number(w.product_types)}</td>
                  <td><strong>{number(w.stock_units)}</strong></td>
                  <td className="price-cell">{money(w.inventory_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel report-panel">
        <div className="panel-heading">
          <div><h2>Supplier Performance</h2><p>Procurement activity, ratings and average lead time</p></div>
          <Truck className="heading-green" size={20} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>SUPPLIER</th><th>ORDERS</th><th>PROCUREMENT VALUE</th><th>LEAD TIME</th><th>RATING</th></tr></thead>
            <tbody>
              {supplierData.map((s) => (
                <tr key={s.supplier_id}>
                  <td><strong>{s.supplier_name}</strong></td>
                  <td>{number(s.total_orders)}</td>
                  <td className="price-cell">{money(s.procurement_value)}</td>
                  <td>{s.avg_lead_days} days</td>
                  <td><span className="report-rating">? {s.rating ?? "N/A"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-chart-grid">
        <article className="panel report-panel">
          <div className="panel-heading">
            <div><h2>Purchase Order Analytics</h2><p>Order volume and procurement value</p></div>
            <FileBarChart className="heading-green" size={20} />
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>STATUS</th><th>ORDERS</th><th>ORDER VALUE</th></tr></thead>
              <tbody>
                {orderData.map((o) => (
                  <tr key={o.status}>
                    <td><span className={`status-pill ${o.status === "RECEIVED" ? "healthy" : "low"}`}><i />{o.status}</span></td>
                    <td>{number(o.order_count)}</td>
                    <td className="price-cell">{money(o.order_value)}</td>
                  </tr>
                ))}
                {orderData.length === 0 && <tr><td colSpan="3" className="empty-table">No purchase orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel report-panel">
          <div className="panel-heading">
            <div><h2>Recent Stock Movements</h2><p>Latest warehouse transfers</p></div>
            <ArrowLeftRight className="heading-green" size={20} />
          </div>
          <div className="movement-list">
            {movementData.map((m) => (
              <div className="movement-row" key={m.transfer_id}>
                <div className="movement-icon"><ArrowLeftRight size={17} /></div>
                <div className="movement-copy">
                  <strong>{m.product_name}</strong>
                  <span>{m.from_warehouse} ? {m.to_warehouse}</span>
                  <small>{new Date(m.created_at).toLocaleString("en-IN")}</small>
                </div>
                <div className="movement-quantities"><span className="movement-out">OUT -{number(m.quantity)}</span><span className="movement-in">IN +{number(m.quantity)}</span></div>
              </div>
            ))}
            {movementData.length === 0 && <div className="empty-state">No stock movements recorded yet.</div>}
          </div>
        </article>
      </section>

      <section className="panel report-panel">
        <div className="panel-heading">
          <div><h2>Low-Stock Analysis</h2><p>Products approaching their reorder thresholds</p></div>
          <AlertTriangle size={20} color="#d88b2d" />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>PRODUCT</th><th>SKU</th><th>WAREHOUSE</th><th>CURRENT STOCK</th><th>REORDER LEVEL</th><th>STATUS</th></tr></thead>
            <tbody>
              {alertData.map((a) => (
                <tr key={a.alert_id}>
                  <td><strong>{a.product_name}</strong></td>
                  <td className="sku-cell">{a.sku}</td>
                  <td>{a.warehouse_name}</td>
                  <td><strong>{number(a.current_qty)}</strong></td>
                  <td>{number(a.reorder_threshold)}</td>
                  <td><span className="status-pill low"><i /> Reorder needed</span></td>
                </tr>
              ))}
              {alertData.length === 0 && <tr><td colSpan="6" className="empty-table">No low-stock alerts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

        </>
      )}

      <footer className="footer">
        <span>� 2026 StockVault Inventory Management</span>
        <span><i /> Reports generated from PostgreSQL</span>
      </footer>
    </div>
  );
}

export default Reports;









