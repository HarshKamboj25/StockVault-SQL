import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus, Search, RefreshCw, ShoppingCart, Clock,
  CheckCircle2, PackageCheck, X, Trash2, Truck
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState([
    { product_id: "", ordered_qty: 1, unit_price: "" }
  ]);
  const [receivedItems, setReceivedItems] = useState([]);
  const [form, setForm] = useState({
    supplier_id: "",
    warehouse_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [animationRun, setAnimationRun] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [o, s, w, p] = await Promise.all([
        axios.get(`${API}/purchase-orders`),
        axios.get(`${API}/suppliers`),
        axios.get(`${API}/warehouses`),
        axios.get(`${API}/products`),
      ]);

      setOrders(o.data.data || []);
      setSuppliers(s.data.data || []);
      setWarehouses(w.data.data || []);
      setProducts((p.data.data || []).filter(product => product.is_active));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load purchase orders.");
    } finally {
      setLoading(false);
      setAnimationRun((current) => current + 1);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => orders.filter(order => {
    const matchesSearch = [
      order.po_number,
      order.supplier_name,
      order.warehouse_name,
    ].join(" ").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }), [orders, search, statusFilter]);

  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.order_value || 0), 0
  );

  const pendingCount = orders.filter(
    order => order.status === "DRAFT" || order.status === "APPROVED"
  ).length;

  const addItem = () => {
    setItems([...items, { product_id: "", ordered_qty: 1, unit_price: "" }]);
  };

  const updateItem = (index, field, value) => {
    setItems(current => current.map((item, i) => {
      if (i !== index) return item;

      if (field === "product_id") {
        const product = products.find(p => String(p.product_id) === value);
        return {
          ...item,
          product_id: value,
          unit_price: product ? String(product.unit_price) : "",
        };
      }

      return { ...item, [field]: value };
    }));
  };

  const removeItem = (index) => {
    setItems(current => current.filter((_, i) => i !== index));
  };

  const orderTotal = items.reduce(
    (sum, item) =>
      sum + Number(item.ordered_qty || 0) * Number(item.unit_price || 0),
    0
  );

  const openCreate = () => {
    setForm({ supplier_id: "", warehouse_id: "" });
    setItems([{ product_id: "", ordered_qty: 1, unit_price: "" }]);
    setError("");
    setMessage("");
    setModal("create");
  };

  const createOrder = async (e) => {
    e.preventDefault();

    if (items.some(item =>
      !item.product_id ||
      !Number.isInteger(Number(item.ordered_qty)) ||
      Number(item.ordered_qty) <= 0 ||
      !Number.isFinite(Number(item.unit_price)) ||
      Number(item.unit_price) < 0
    )) {
      setError("Please enter valid products, quantities and prices.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await axios.post(`${API}/purchase-orders`, {
        supplier_id: Number(form.supplier_id),
        warehouse_id: Number(form.warehouse_id),
        items: items.map(item => ({
          product_id: Number(item.product_id),
          ordered_qty: Number(item.ordered_qty),
          unit_price: Number(item.unit_price),
        })),
      });

      setModal("");
      setMessage("Purchase order created successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create purchase order.");
    } finally {
      setSaving(false);
    }
  };

  const approveOrder = async (order) => {
    if (!window.confirm(`Approve ${order.po_number}?`)) return;

    try {
      setError("");
      await axios.patch(`${API}/purchase-orders/${order.po_id}/approve`);
      setMessage(`${order.po_number} approved successfully.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not approve order.");
    }
  };

  const openReceive = async (order) => {
    try {
      const response = await axios.get(
        `${API}/purchase-orders/${order.po_id}`
      );

      const orderItems = response.data.data.items || [];

      setSelectedOrder(order);
      setReceivedItems(orderItems.map(item => ({
        product_id: String(item.product_id),
        product_name: item.product_name,
        ordered_qty: Number(item.ordered_qty),
        received_qty: Number(item.received_qty),
        receive_now: 0,
      })));

      setError("");
      setModal("receive");
    } catch (err) {
      setError(err.response?.data?.message ||
        "Could not load order details. Check the order details API.");
    }
  };

  const receiveStock = async (e) => {
    e.preventDefault();

    const receiving = receivedItems
      .filter(item => Number(item.receive_now) > 0)
      .map(item => ({
        product_id: Number(item.product_id),
        received_qty: Number(item.receive_now),
      }));

    if (!receiving.length) {
      setError("Enter at least one quantity to receive.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await axios.post(
        `${API}/purchase-orders/${selectedOrder.po_id}/receive`,
        { items: receiving }
      );

      setModal("");
      setMessage("Stock received and inventory updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not receive stock.");
    } finally {
      setSaving(false);
    }
  };

  const statusClass = (status) =>
    status === "RECEIVED" ? "received" :
    status === "APPROVED" ? "approved" :
    status === "CANCELLED" ? "cancelled" : "draft";

  return (
    <div className="po-page">
      <div className="page-heading">
        <div>
          <h1>Purchase Orders</h1>
          <p>Manage suppliers, incoming stock and procurement orders.</p>
        </div>
        <button className="primary-btn" onClick={openCreate}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      {error && <div className="po-alert error">{error}</div>}
      {message && <div className="po-alert success">{message}</div>}

      <div className="po-summary" key={`po-summary-${animationRun}`}>
        <div className="panel">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small><ShoppingCart size={13} /> All purchase orders</small>
        </div>
        <div className="panel">
          <span>Pending Orders</span>
          <strong>{pendingCount}</strong>
          <small><Clock size={13} /> Awaiting completion</small>
        </div>
        <div className="panel">
          <span>Total Order Value</span>
          <strong>{money(totalValue)}</strong>
          <small><Truck size={13} /> Across all orders</small>
        </div>
      </div>

      <div className="panel po-table-panel" key={`po-register-${animationRun}`}>
        <div className="products-toolbar">
          <div>
            <h2>Purchase Order Register</h2>
            <p>Track and manage all supplier orders</p>
          </div>
          <button className="po-refresh" onClick={loadData} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="products-filters">
          <div className="po-search">
            <Search size={15} />
            <input
              placeholder="Search order, supplier or warehouse..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="po-empty">Loading purchase orders...</div>
        ) : filtered.length === 0 ? (
          <div className="po-empty">No purchase orders found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Supplier</th>
                  <th>Warehouse</th>
                  <th>Items</th>
                  <th>Order Value</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.po_id}>
                    <td><strong>{order.po_number}</strong></td>
                    <td>{order.supplier_name}</td>
                    <td>{order.warehouse_name}</td>
                    <td>{order.item_count}</td>
                    <td>{money(order.order_value)}</td>
                    <td>
                      <span className={`po-status ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div className="po-actions">
                        {order.status === "DRAFT" && (
                          <button onClick={() => approveOrder(order)}>
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}
                        {order.status === "APPROVED" && (
                          <button onClick={() => openReceive(order)}>
                            <PackageCheck size={14} /> Receive
                          </button>
                        )}
                        {order.status === "RECEIVED" && (
                          <span className="po-complete">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "create" && (
        <div className="modal-backdrop">
          <form className="product-modal po-modal" onSubmit={createOrder}>
            <div className="modal-heading">
              <div>
                <h2>Create Purchase Order</h2>
                <p>Add supplier, destination and products.</p>
              </div>
              <button type="button" className="modal-close"
                onClick={() => setModal("")}><X size={17} /></button>
            </div>

            <label>Supplier</label>
            <select required value={form.supplier_id}
              onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map(s => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
              ))}
            </select>

            <label>Destination Warehouse</label>
            <select required value={form.warehouse_id}
              onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>
              ))}
            </select>

            <div className="po-items-heading">
              <strong>Order Items</strong>
              <button type="button" onClick={addItem}><Plus size={14} /> Add Item</button>
            </div>

            {items.map((item, index) => (
              <div className="po-item-row" key={index}>
                <div>
                  <label>Product</label>
                  <select required value={item.product_id}
                    onChange={e => updateItem(index, "product_id", e.target.value)}>
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Quantity</label>
                  <input required type="number" min="1" step="1"
                    value={item.ordered_qty}
                    onChange={e => updateItem(index, "ordered_qty", e.target.value)} />
                </div>
                <div>
                  <label>Unit Price (₹)</label>
                  <input required type="number" min="0" step="0.01"
                    value={item.unit_price}
                    onChange={e => updateItem(index, "unit_price", e.target.value)} />
                </div>
                {items.length > 1 && (
                  <button type="button" className="po-remove"
                    onClick={() => removeItem(index)}><Trash2 size={15} /></button>
                )}
              </div>
            ))}

            <div className="po-total">
              <span>Estimated Order Value</span>
              <strong>{money(orderTotal)}</strong>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn"
                onClick={() => setModal("")}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "receive" && (
        <div className="modal-backdrop">
          <form className="product-modal po-modal" onSubmit={receiveStock}>
            <div className="modal-heading">
              <div>
                <h2>Receive Stock</h2>
                <p>{selectedOrder?.po_number} · Enter quantities received now.</p>
              </div>
              <button type="button" className="modal-close"
                onClick={() => setModal("")}><X size={17} /></button>
            </div>

            {receivedItems.map((item, index) => (
              <div className="po-receive-row" key={item.product_id}>
                <div>
                  <strong>{item.product_name}</strong>
                  <small>Ordered: {item.ordered_qty} · Already received: {item.received_qty}</small>
                  <small>Remaining: {item.ordered_qty - item.received_qty}</small>
                </div>
                <div>
                  <label>Receive now</label>
                  <input type="number" min="0"
                    max={item.ordered_qty - item.received_qty}
                    step="1"
                    value={item.receive_now}
                    onChange={e => setReceivedItems(current =>
                      current.map((row, i) =>
                        i === index ? { ...row, receive_now: e.target.value } : row
                      )
                    )}
                  />
                </div>
              </div>
            ))}

            <div className="modal-actions">
              <button type="button" className="secondary-btn"
                onClick={() => setModal("")}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Receiving..." : "Confirm Receipt"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
