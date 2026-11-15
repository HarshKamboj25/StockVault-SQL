import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeftRight, Plus, Search, RefreshCw, Package,
  Warehouse, ArrowRight, X, CheckCircle2, AlertCircle,
  Clock, Boxes
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function StockTransfers() {
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [animationRun, setAnimationRun] = useState(0);

  const [form, setForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    product_id: "",
    quantity: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [warehouseRes, transferRes] = await Promise.all([
        axios.get(`${API}/warehouses`),
        axios.get(`${API}/transfers`),
      ]);

      setWarehouses(warehouseRes.data.data || []);
      setTransfers(transferRes.data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transfer data.");
    } finally {
      setLoading(false);
      setAnimationRun((current) => current + 1);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadInventory = async () => {
      if (!form.from_warehouse_id) {
        setInventory([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API}/warehouses/${form.from_warehouse_id}/inventory`
        );
        setInventory(response.data.data || []);
      } catch (err) {
        setInventory([]);
        setError("Could not load source warehouse inventory.");
      }
    };

    loadInventory();
  }, [form.from_warehouse_id]);

  const availableWarehouses = warehouses.filter(
    w => String(w.warehouse_id) !== String(form.from_warehouse_id)
  );

  const selectedProduct = inventory.find(
    p => String(p.product_id) === String(form.product_id)
  );

  const filteredTransfers = transfers.filter(t =>
    [
      t.product_name,
      t.sku,
      t.from_warehouse,
      t.to_warehouse,
      t.status,
      t.transfer_id,
    ].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = transfers.reduce(
    (sum, t) => sum + Number(t.quantity || 0), 0
  );

  const openModal = () => {
    setForm({
      from_warehouse_id: "",
      to_warehouse_id: "",
      product_id: "",
      quantity: "",
    });
    setInventory([]);
    setError("");
    setSuccess("");
    setModal(true);
  };

  const closeModal = () => {
    if (!saving) setModal(false);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    const quantity = Number(form.quantity);

    if (!form.from_warehouse_id || !form.to_warehouse_id ||
        !form.product_id || !Number.isInteger(quantity) || quantity <= 0) {
      setError("Please complete all fields with a valid positive quantity.");
      return;
    }

    if (form.from_warehouse_id === form.to_warehouse_id) {
      setError("Source and destination warehouses must be different.");
      return;
    }

    if (!selectedProduct || quantity > Number(selectedProduct.qty_on_hand)) {
      setError("Transfer quantity exceeds available stock.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await axios.post(`${API}/transfers`, {
        from_warehouse_id: Number(form.from_warehouse_id),
        to_warehouse_id: Number(form.to_warehouse_id),
        product_id: Number(form.product_id),
        quantity,
      });

      setSuccess(
        `${response.data.message}. Transfer ID: ${response.data.transfer_id}`
      );
      setModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Stock transfer failed.");
    } finally {
      setSaving(false);
    }
  };

  const money = value => Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="transfers-page">
      <div className="page-heading">
        <div>
          <h1>Stock Transfers</h1>
          <p>Move inventory between warehouses and track every transfer.</p>
        </div>
        <button className="primary-btn" onClick={openModal}>
          <Plus size={16} /> New Transfer
        </button>
      </div>

      {error && !modal && (
        <div className="transfer-alert error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="transfer-alert success">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="transfer-summary">
        <div className="panel">
          <span>Total Transfers</span>
          <strong>{transfers.length}</strong>
          <small><ArrowLeftRight size={13} /> Recorded movements</small>
        </div>
        <div className="panel">
          <span>Units Transferred</span>
          <strong>{totalUnits.toLocaleString("en-IN")}</strong>
          <small><Boxes size={13} /> Total quantity moved</small>
        </div>
        <div className="panel">
          <span>Active Warehouses</span>
          <strong>{warehouses.filter(w => w.is_active).length}</strong>
          <small><Warehouse size={13} /> Available locations</small>
        </div>
      </div>

      <div className="transfer-workflow panel" key={`transfer-workflow-${animationRun}`}>
        <div className="transfer-workflow-heading">
          <div>
            <h2>Transfer Inventory</h2>
            <p>Move stock securely from one warehouse to another.</p>
          </div>
          <div className="transfer-workflow-icon">
            <ArrowLeftRight size={20} />
          </div>
        </div>

        <div className="transfer-flow">
          <div className="transfer-flow-item">
            <span>FROM WAREHOUSE</span>
            <div><Warehouse size={19} /><strong>Source Location</strong></div>
            <small>Choose where stock will be deducted</small>
          </div>
          <div className="transfer-flow-arrow"><ArrowRight size={21} /></div>
          <div className="transfer-flow-item">
            <span>TO WAREHOUSE</span>
            <div><Warehouse size={19} /><strong>Destination Location</strong></div>
            <small>Choose where stock will be received</small>
          </div>
          <button className="primary-btn" onClick={openModal}>
            <Plus size={15} /> Create Transfer
          </button>
        </div>
      </div>

      <div className="panel transfers-table-panel" key={`transfer-history-${animationRun}`}>
        <div className="products-toolbar">
          <div>
            <h2>Transfer History</h2>
            <p>Review inventory movements across warehouses.</p>
          </div>
          <button className="po-refresh" onClick={loadData} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="products-filters">
          <div className="po-search">
            <Search size={15} />
            <input
              placeholder="Search product, warehouse or transfer ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="po-empty">Loading transfer history...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="po-empty">No stock transfers found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TRANSFER ID</th>
                  <th>PRODUCT</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>QUANTITY</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map(t => (
                  <tr key={t.transfer_id}>
                    <td><strong>TRF-{String(t.transfer_id).padStart(4, "0")}</strong></td>
                    <td>
                      <div className="transfer-product-cell">
                        <div className="transfer-product-icon"><Package size={16} /></div>
                        <div>
                          <strong>{t.product_name}</strong>
                          <small>{t.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>{t.from_warehouse}</td>
                    <td>{t.to_warehouse}</td>
                    <td><strong>{Number(t.quantity).toLocaleString("en-IN")} units</strong></td>
                    <td>
                      <span className="transfer-status">
                        <i /> {t.status || "COMPLETED"}
                      </span>
                    </td>
                    <td>{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <form className="product-modal transfer-modal" onSubmit={handleTransfer}>
            <div className="modal-heading">
              <div>
                <h2>Create Stock Transfer</h2>
                <p>Specify the source, destination and quantity.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="transfer-alert error">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <label>Source Warehouse *</label>
            <select required value={form.from_warehouse_id}
              onChange={e => setForm({
                ...form,
                from_warehouse_id: e.target.value,
                to_warehouse_id: "",
                product_id: "",
                quantity: "",
              })}>
              <option value="">Select source warehouse</option>
              {warehouses.filter(w => w.is_active).map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>

            <label>Destination Warehouse *</label>
            <select required value={form.to_warehouse_id}
              onChange={e => setForm({ ...form, to_warehouse_id: e.target.value })}>
              <option value="">Select destination warehouse</option>
              {availableWarehouses.filter(w => w.is_active).map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>

            <label>Product *</label>
            <select required value={form.product_id}
              disabled={!form.from_warehouse_id}
              onChange={e => setForm({
                ...form,
                product_id: e.target.value,
                quantity: "",
              })}>
              <option value="">Select product</option>
              {inventory.filter(p => Number(p.qty_on_hand) > 0).map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.sku})
                </option>
              ))}
            </select>

            {selectedProduct && (
              <div className="transfer-stock-info">
                <span>Available stock</span>
                <strong>{selectedProduct.qty_on_hand} units</strong>
                <small>Unit price: {money(selectedProduct.unit_price)}</small>
              </div>
            )}

            <label>Transfer Quantity *</label>
            <input required type="number" min="1"
              max={selectedProduct?.qty_on_hand || undefined}
              step="1"
              disabled={!selectedProduct}
              placeholder="Enter quantity"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })} />

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Processing..." : "Confirm Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
