import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Boxes, Package, AlertTriangle, Coins,
  Search, RefreshCw, Warehouse
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export default function Inventory() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animationRun, setAnimationRun] = useState(0);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const [w, p] = await Promise.all([
        axios.get(`${API}/warehouses`),
        axios.get(`${API}/products`),
      ]);

      const warehouseData = w.data.data || [];
      const productData = p.data.data || [];

      setWarehouses(warehouseData);
      setProducts(productData);

      const inventoryResults = await Promise.all(
        warehouseData.map(async (warehouse) => {
          const response = await axios.get(
            `${API}/warehouses/${warehouse.warehouse_id}/inventory`
          );

          return (response.data.data || []).map((item) => ({
            ...item,
            warehouse_id: warehouse.warehouse_id,
            warehouse_name: warehouse.name,
            warehouse_city: warehouse.city,
          }));
        })
      );

      setStock(inventoryResults.flat());
    } catch (err) {
      setError(err.response?.data?.message || "Could not load inventory.");
    } finally {
      setLoading(false);
      setAnimationRun((current) => current + 1);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const totalUnits = stock.reduce(
    (sum, item) => sum + Number(item.qty_on_hand || 0), 0
  );

  const totalValue = stock.reduce(
    (sum, item) => sum + Number(item.qty_on_hand || 0) * Number(item.unit_price || 0), 0
  );

  const lowStock = stock.filter(
    (item) => Number(item.qty_on_hand) <= Number(item.reorder_threshold)
  );

  const filtered = useMemo(() => stock.filter((item) => {
    const matchesSearch = [
      item.product_name,
      item.sku,
      item.warehouse_name,
      item.bin_location,
    ].join(" ").toLowerCase().includes(search.toLowerCase());

    const matchesWarehouse =
      warehouseFilter === "all" ||
      String(item.warehouse_id) === warehouseFilter;

    const isLow =
      Number(item.qty_on_hand) <= Number(item.reorder_threshold);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "low" && isLow) ||
      (statusFilter === "healthy" && !isLow);

    return matchesSearch && matchesWarehouse && matchesStatus;
  }), [stock, search, warehouseFilter, statusFilter]);

  return (
    <section className="inventory-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INVENTORY CONTROL CENTER</div>
          <h1>Inventory <span>✦</span></h1>
          <p>Track stock availability across every warehouse location.</p>
        </div>
        <button className="secondary-button" onClick={loadInventory}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={17} />{error}</div>}

      <div className="inventory-summary" key={`inventory-summary-${animationRun}`}>
        <article className="panel">
          <div className="inventory-summary-icon green"><Boxes size={19} /></div>
          <span>Total Stock Units</span>
          <strong>{totalUnits.toLocaleString("en-IN")}</strong>
          <small>Across all warehouse locations</small>
        </article>
        <article className="panel">
          <div className="inventory-summary-icon blue"><Package size={19} /></div>
          <span>Active Products</span>
          <strong>{products.filter((p) => p.is_active).length}</strong>
          <small>Registered active products</small>
        </article>
        <article className="panel">
          <div className="inventory-summary-icon red"><AlertTriangle size={19} /></div>
          <span>Low Stock Records</span>
          <strong>{lowStock.length}</strong>
          <small>Warehouse-level stock alerts</small>
        </article>
        <article className="panel">
          <div className="inventory-summary-icon mint"><Coins size={19} /></div>
          <span>Inventory Valuation</span>
          <strong>{money(totalValue)}</strong>
          <small>Current stock value</small>
        </article>
      </div>

      <div className="inventory-warehouse-strip" key={`inventory-warehouses-${animationRun}`}>
        {warehouses.map((w) => (
          <div className="inventory-warehouse-card" key={w.warehouse_id}>
            <div className="inventory-warehouse-icon"><Warehouse size={19} /></div>
            <div>
              <strong>{w.name}</strong>
              <span>{w.city}</span>
            </div>
            <div className="inventory-warehouse-number">
              <strong>{Number(w.total_stock_units).toLocaleString("en-IN")}</strong>
              <span>units</span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel inventory-panel" key={`inventory-register-${animationRun}`}>
        <div className="products-toolbar">
          <div>
            <h2>Stock Register</h2>
            <p>Live product quantities by warehouse and storage location.</p>
          </div>
          <span className="record-count">{filtered.length} records</span>
        </div>

        <div className="products-filters">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, warehouse or bin..."
            />
          </div>

          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={String(w.warehouse_id)}>
                {w.name}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock</option>
            <option value="healthy">In Stock</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>WAREHOUSE</th>
                <th>BIN LOCATION</th>
                <th>UNIT PRICE</th>
                <th>QUANTITY</th>
                <th>REORDER LEVEL</th>
                <th>STOCK VALUE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const low = Number(item.qty_on_hand) <= Number(item.reorder_threshold);
                return (
                  <tr key={`${item.warehouse_id}-${item.product_id}-${index}`}>
                    <td>
                      <div className="product-cell">
                        <div className="product-avatar"><Package size={17} /></div>
                        <strong>{item.product_name}</strong>
                      </div>
                    </td>
                    <td className="sku-cell">{item.sku}</td>
                    <td>
                      <div className="inventory-warehouse-name">
                        <strong>{item.warehouse_name}</strong>
                        <span>{item.warehouse_city}</span>
                      </div>
                    </td>
                    <td><span className="category-pill">{item.bin_location || "Not assigned"}</span></td>
                    <td className="price-cell">{money(item.unit_price)}</td>
                    <td><strong>{Number(item.qty_on_hand).toLocaleString("en-IN")}</strong></td>
                    <td>{item.reorder_threshold}</td>
                    <td className="price-cell">{money(Number(item.qty_on_hand) * Number(item.unit_price))}</td>
                    <td>
                      <span className={`status-pill ${low ? "low" : "healthy"}`}>
                        <i />{low ? "Low stock" : "In stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan="9" className="empty-table">No matching inventory records found.</td></tr>
              )}

              {loading && (
                <tr><td colSpan="9" className="empty-table">Loading inventory records...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
