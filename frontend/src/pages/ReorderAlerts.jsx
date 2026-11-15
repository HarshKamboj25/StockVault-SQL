import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search, RefreshCw, AlertTriangle, Package,
  Warehouse, AlertCircle, CheckCircle2, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ReorderAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [animationRun, setAnimationRun] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [alertRes, warehouseRes] = await Promise.all([
        axios.get(`${API}/alerts`),
        axios.get(`${API}/warehouses`),
      ]);

      setAlerts(alertRes.data.data || []);
      setWarehouses(warehouseRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reorder alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateAlerts = async () => {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const response = await axios.post(`${API}/alerts/generate`);

      setAlerts(response.data.data || []);
      setMessage(
        `Alerts generated successfully. ${response.data.count} active alerts found.`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate reorder alerts.");
    } finally {
      setGenerating(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = [
        alert.product_name,
        alert.sku,
        alert.warehouse_name,
      ].join(" ").toLowerCase().includes(search.toLowerCase());

      const matchesWarehouse =
        warehouseFilter === "all" ||
        String(alert.warehouse_name) === warehouseFilter;

      return matchesSearch && matchesWarehouse;
    });
  }, [alerts, search, warehouseFilter]);

  const criticalCount = alerts.filter(
    a => Number(a.current_qty) === 0
  ).length;

  const lowStockCount = alerts.filter(
    a => Number(a.current_qty) > 0
  ).length;

  const affectedProducts = new Set(
    alerts.map(a => a.sku)
  ).size;

  const shortageUnits = alerts.reduce(
    (sum, a) => sum + Math.max(
      0,
      Number(a.reorder_threshold) - Number(a.current_qty)
    ), 0
  );

  return (
    <div className="reorder-page">
      <div className="page-heading">
        <div>
          <h1>Reorder Alerts</h1>
          <p>Monitor low-stock inventory and identify products that need replenishment.</p>
        </div>
        <button
          className="primary-btn"
          onClick={generateAlerts}
          disabled={generating}
        >
          <RefreshCw size={15} className={generating ? "reorder-spinning" : ""} />
          {generating ? "Generating..." : "Generate Alerts"}
        </button>
      </div>

      {error && (
        <div className="reorder-alert-message error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {message && (
        <div className="reorder-alert-message success">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      <div className="reorder-summary" key={`reorder-summary-${animationRun}`}>
        <div className="panel">
          <span>Total Active Alerts</span>
          <strong>{alerts.length}</strong>
          <small><AlertTriangle size={13} /> Requires attention</small>
        </div>

        <div className="panel">
          <span>Critical Stockouts</span>
          <strong>{criticalCount}</strong>
          <small><Zap size={13} /> Zero stock remaining</small>
        </div>

        <div className="panel">
          <span>Low Stock Items</span>
          <strong>{lowStockCount}</strong>
          <small><Package size={13} /> Below reorder level</small>
        </div>

        <div className="panel">
          <span>Affected Products</span>
          <strong>{affectedProducts}</strong>
          <small><Warehouse size={13} /> Across all warehouses</small>
        </div>
      </div>

      <div className="reorder-insight panel" key={`reorder-insight-${animationRun}`}>
        <div className="reorder-insight-icon">
          <AlertTriangle size={21} />
        </div>
        <div>
          <h3>Inventory Replenishment Overview</h3>
          <p>
            {alerts.length === 0
              ? "No products currently require replenishment."
              : `${shortageUnits} units below the combined reorder thresholds across ${alerts.length} warehouse alerts. Review the list and plan replenishment.`}
          </p>
        </div>
        <div className="reorder-insight-count">
          <strong>{shortageUnits}</strong>
          <span>Units below threshold</span>
        </div>
      </div>

      <div className="panel reorder-table-panel" key={`reorder-table-${animationRun}`}>
        <div className="products-toolbar">
          <div>
            <h2>Low Stock Directory</h2>
            <p>Products that have reached or fallen below their reorder thresholds.</p>
          </div>
          <button
            className="po-refresh"
            onClick={loadData}
            disabled={loading}
            title="Refresh alerts"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="products-filters reorder-filters">
          <div className="po-search">
            <Search size={15} />
            <input
              placeholder="Search product, SKU or warehouse..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={e => setWarehouseFilter(e.target.value)}
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="po-empty">Loading reorder alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="reorder-empty">
            <CheckCircle2 size={30} />
            <strong>No matching alerts</strong>
            <span>Try changing your search or warehouse filter.</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>WAREHOUSE</th>
                  <th>CURRENT STOCK</th>
                  <th>REORDER LEVEL</th>
                  <th>STOCK GAP</th>
                  <th>PRIORITY</th>
                  <th>GENERATED</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => {
                  const current = Number(alert.current_qty);
                  const threshold = Number(alert.reorder_threshold);
                  const critical = current === 0;
                  const gap = Math.max(0, threshold - current);

                  return (
                    <tr key={alert.alert_id}>
                      <td>
                        <div className="reorder-product-cell">
                          <div className="reorder-product-icon">
                            <Package size={16} />
                          </div>
                          <div>
                            <strong>{alert.product_name}</strong>
                            <small>{alert.sku}</small>
                          </div>
                        </div>
                      </td>
                      <td>{alert.warehouse_name}</td>
                      <td>
                        <strong className={critical ? "reorder-zero" : "reorder-low"}>
                          {current} units
                        </strong>
                      </td>
                      <td>{threshold} units</td>
                      <td>
                        <span className="reorder-gap">{gap} units</span>
                      </td>
                      <td>
                        <span className={`reorder-priority ${critical ? "critical" : "low"}`}>
                          <i />
                          {critical ? "Critical" : "Low Stock"}
                        </span>
                      </td>
                      <td>
                        {alert.generated_at
                          ? new Date(alert.generated_at).toLocaleDateString("en-IN")
                          : "Recently"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="reorder-table-footer">
          <span>Showing {filteredAlerts.length} of {alerts.length} alerts</span>
          <span><i /> Live database records</span>
        </div>
      </div>
    </div>
  );
}
