import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Ban, Package, X, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const emptyForm = {
  sku: "",
  name: "",
  category_id: "",
  unit_price: "",
  reorder_threshold: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [animationCycle, setAnimationCycle] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [p, c] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/products/categories`),
      ]);
      setProducts(p.data.data || []);
      setCategories(c.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    await loadData();
    setAnimationCycle((current) => current + 1);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => products.filter((p) => {
    const matchesSearch = [p.name, p.sku, p.category_name]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || String(p.category_id) === category;
    return matchesSearch && matchesCategory;
  }), [products, search, category]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku || "",
      name: product.name || "",
      category_id: String(product.category_id || ""),
      unit_price: String(product.unit_price || ""),
      reorder_threshold: String(product.reorder_threshold || ""),
    });
    setMessage("");
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        unit_price: Number(form.unit_price),
        reorder_threshold: Number(form.reorder_threshold),
      };

      if (editing) {
        await axios.put(`${API}/products/${editing.product_id}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await axios.post(`${API}/products`, payload);
        setMessage("Product added successfully.");
      }

      setModal(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateProduct = async (product) => {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;
    try {
      setError("");
      await axios.patch(`${API}/products/${product.product_id}/deactivate`);
      setMessage("Product deactivated successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not deactivate product.");
    }
  };

  return (
    <section className="products-page">
      <div className="page-heading" key={`heading-${animationCycle}`}>
        <div>
          <div className="eyebrow">INVENTORY CONTROL CENTER</div>
          <h1>Products <span>✦</span></h1>
          <p>Manage your product catalogue, pricing and stock thresholds.</p>
        </div>
        <button className="primary-button" onClick={openAdd}>
          <Plus size={17} /> Add Product
        </button>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="product-summary" key={`summary-${animationCycle}`}>
        <div className="panel">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="panel">
          <span>Active Products</span>
          <strong>{products.filter((p) => p.is_active).length}</strong>
        </div>
        <div className="panel">
          <span>Low Stock Items</span>
          <strong>{products.filter((p) => Number(p.total_stock) <= Number(p.reorder_threshold)).length}</strong>
        </div>
      </div>

      <div className="panel products-table-panel" key={`catalogue-${animationCycle}`}>
        <div className="products-toolbar">
          <div>
            <h2>Product Catalogue</h2>
            <p>All products registered in your inventory database</p>
          </div>
          <button className="secondary-button" onClick={refreshProducts} disabled={loading}>
            <RefreshCw size={15} className={loading ? "refresh-spinning" : ""} /> Refresh
          </button>
        </div>

        <div className="products-filters">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU or category..."
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={String(c.category_id)}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="record-count">{filtered.length} products</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>CATEGORY</th>
                <th>UNIT PRICE</th>
                <th>REORDER LEVEL</th>
                <th>TOTAL STOCK</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = Number(p.total_stock) <= Number(p.reorder_threshold);
                return (
                  <tr key={p.product_id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-avatar"><Package size={18} /></div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td className="sku-cell">{p.sku}</td>
                    <td><span className="category-pill">{p.category_name}</span></td>
                    <td className="price-cell">{money(p.unit_price)}</td>
                    <td>{p.reorder_threshold}</td>
                    <td><strong>{Number(p.total_stock || 0).toLocaleString("en-IN")}</strong></td>
                    <td>
                      <span className={`status-pill ${!p.is_active ? "low" : low ? "low" : "healthy"}`}>
                        <i />{!p.is_active ? "Inactive" : low ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button title="Edit product" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                        {p.is_active && (
                          <button title="Deactivate product" onClick={() => deactivateProduct(p)}><Ban size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="8" className="empty-table">No matching products found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="8" className="empty-table">Loading products...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop">
          <form className="product-modal" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <h2>{editing ? "Edit Product" : "Add New Product"}</h2>
                <p>Enter the product details below.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setModal(false)}><X size={19} /></button>
            </div>

            <label>Product SKU</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. KB-002" />

            <label>Product Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" />

            <label>Category</label>
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>

            <div className="form-two-columns">
              <div>
                <label>Unit Price (₹)</label>
                <input required type="number" min="0.01" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              </div>
              <div>
                <label>Reorder Threshold</label>
                <input required type="number" min="0" step="1" value={form.reorder_threshold} onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
