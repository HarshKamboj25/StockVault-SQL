import { useEffect, useState } from "react";
import axios from "axios";
import {
  Warehouse, Package, Boxes, Coins, MapPin,
  RefreshCw, Activity, ChevronRight
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [animationCycle, setAnimationCycle] = useState(0);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API}/warehouses`);
      const data = response.data.data || [];
      setWarehouses(data);

      if (data.length > 0) {
        const current = data.find(
          (w) => String(w.warehouse_id) === String(selected)
        );
        const firstId = current?.warehouse_id || data[0].warehouse_id;
        setSelected(firstId);
        await loadInventory(firstId);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (id) => {
    try {
      setDetailLoading(true);
      setError("");
      const response = await axios.get(`${API}/warehouses/${id}/inventory`);
      setInventory(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load warehouse inventory.");
      setInventory([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const refreshWarehouses = async () => {
    await loadWarehouses();
    setAnimationCycle((current) => current + 1);
  };

  const chooseWarehouse = (id) => {
    setSelected(id);
    loadInventory(id);
  };

  const activeWarehouse = warehouses.find(
    (w) => String(w.warehouse_id) === String(selected)
  );

  const totalUnits = warehouses.reduce(
    (sum, w) => sum + Number(w.total_stock_units || 0), 0
  );

  const totalValue = warehouses.reduce(
    (sum, w) => sum + Number(w.inventory_value || 0), 0
  );

  const totalCapacity = warehouses.reduce(
    (sum, w) => sum + Number(w.capacity_units || 0), 0
  );

  const utilization = activeWarehouse
    ? Math.min(
        100,
        (Number(activeWarehouse.total_stock_units) /
          Math.max(1, Number(activeWarehouse.capacity_units))) * 100
      )
    : 0;

  return (
    <section className="warehouses-page">
      <div className="page-heading" key={`warehouse-heading-${animationCycle}`}>
        <div>
          <div className="eyebrow">INVENTORY CONTROL CENTER</div>
          <h1>Warehouses <span>✦</span></h1>
          <p>Monitor storage locations, stock distribution and inventory valuation.</p>
        </div>
        <button className="secondary-button" onClick={refreshWarehouses} disabled={loading}>
          <RefreshCw size={15} className={loading ? "warehouse-refresh-spinning" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="warehouse-summary" key={`warehouse-summary-${animationCycle}`}>
        <article className="panel">
          <div className="warehouse-summary-icon green"><Warehouse size={19} /></div>
          <span>Total Warehouses</span>
          <strong>{warehouses.length}</strong>
          <small>Registered locations</small>
        </article>
        <article className="panel">
          <div className="warehouse-summary-icon blue"><Boxes size={19} /></div>
          <span>Total Stock Units</span>
          <strong>{totalUnits.toLocaleString("en-IN")}</strong>
          <small>Across all warehouses</small>
        </article>
        <article className="panel">
          <div className="warehouse-summary-icon mint"><Coins size={19} /></div>
          <span>Inventory Valuation</span>
          <strong>{money(totalValue)}</strong>
          <small>Total stock value</small>
        </article>
        <article className="panel">
          <div className="warehouse-summary-icon amber"><Package size={19} /></div>
          <span>Total Capacity</span>
          <strong>{totalCapacity.toLocaleString("en-IN")}</strong>
          <small>Storage unit capacity</small>
        </article>
      </div>

      <div className="warehouse-cards" key={`warehouse-cards-${animationCycle}`}>
        {warehouses.map((w) => {
          const isSelected = String(selected) === String(w.warehouse_id);
          const percent = Math.min(
            100,
            (Number(w.total_stock_units) / Math.max(1, Number(w.capacity_units))) * 100
          );

          return (
            <button
              key={w.warehouse_id}
              className={`warehouse-card ${isSelected ? "selected" : ""}`}
              onClick={() => chooseWarehouse(w.warehouse_id)}
            >
              <div className="warehouse-card-top">
                <div className="warehouse-card-icon"><Warehouse size={21} /></div>
                <span className="warehouse-active"><i /> Operational</span>
              </div>
              <h2>{w.name}</h2>
              <p><MapPin size={13} /> {w.city} · {w.code}</p>

              <div className="warehouse-card-stats">
                <div><span>Stock Units</span><strong>{Number(w.total_stock_units).toLocaleString("en-IN")}</strong></div>
                <div><span>Product Types</span><strong>{w.product_types}</strong></div>
                <div><span>Inventory Value</span><strong>{money(w.inventory_value)}</strong></div>
              </div>

              <div className="capacity-heading">
                <span>Capacity utilisation</span>
                <strong>{percent.toFixed(1)}%</strong>
              </div>
              <div className="capacity-track">
                <div style={{ width: `${percent}%` }} />
              </div>
              <div className="warehouse-card-footer">
                <span>{Number(w.total_stock_units).toLocaleString("en-IN")} / {Number(w.capacity_units).toLocaleString("en-IN")} units</span>
                <span className="view-details">View details <ChevronRight size={14} /></span>
              </div>
            </button>
          );
        })}
        {!loading && warehouses.length === 0 && (
          <div className="panel empty-state">No warehouses found.</div>
        )}
      </div>

      <div className="panel warehouse-detail-panel" key={`warehouse-detail-${selected}-${animationCycle}`}>
        <div className="warehouse-detail-heading">
          <div>
            <div className="eyebrow">WAREHOUSE INVENTORY</div>
            <h2>{activeWarehouse?.name || "Select a warehouse"}</h2>
            <p>Product-wise stock availability and storage locations.</p>
          </div>
          {activeWarehouse && (
            <span className="warehouse-location"><MapPin size={14} /> {activeWarehouse.city}</span>
          )}
        </div>

        <div className="warehouse-detail-metrics">
          <div><span>Stock Units</span><strong>{Number(activeWarehouse?.total_stock_units || 0).toLocaleString("en-IN")}</strong></div>
          <div><span>Product Types</span><strong>{activeWarehouse?.product_types ?? 0}</strong></div>
          <div><span>Capacity Used</span><strong>{utilization.toFixed(1)}%</strong></div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>UNIT PRICE</th>
                <th>QUANTITY</th>
                <th>REORDER LEVEL</th>
                <th>BIN LOCATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const low = Number(item.qty_on_hand) <= Number(item.reorder_threshold);
                return (
                  <tr key={item.product_id}>
                    <td><div className="product-cell"><div className="product-avatar"><Package size={17} /></div><strong>{item.product_name}</strong></div></td>
                    <td className="sku-cell">{item.sku}</td>
                    <td className="price-cell">{money(item.unit_price)}</td>
                    <td><strong>{Number(item.qty_on_hand).toLocaleString("en-IN")}</strong></td>
                    <td>{item.reorder_threshold}</td>
                    <td><span className="category-pill">{item.bin_location || "Not assigned"}</span></td>
                    <td><span className={`status-pill ${low ? "low" : "healthy"}`}><i />{low ? "Low stock" : "In stock"}</span></td>
                  </tr>
                );
              })}
              {!detailLoading && inventory.length === 0 && (
                <tr><td colSpan="7" className="empty-table">No inventory found for this warehouse.</td></tr>
              )}
              {detailLoading && (
                <tr><td colSpan="7" className="empty-table">Loading warehouse inventory...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
