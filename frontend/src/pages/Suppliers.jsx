import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus, Search, Pencil, Users, Star, Clock,
  RefreshCw, X, Mail, Phone
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  avg_lead_days: 7,
  rating: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [animationRun, setAnimationRun] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load suppliers.");
    } finally {
      setLoading(false);
      setAnimationRun((current) => current + 1);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => suppliers.filter(supplier =>
    [
      supplier.name,
      supplier.email,
      supplier.phone,
    ].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [suppliers, search]);

  const averageRating = suppliers.length
    ? suppliers.reduce((sum, s) => sum + Number(s.rating || 0), 0) /
      suppliers.filter(s => s.rating !== null).length || 0
    : 0;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setModal(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      avg_lead_days: String(supplier.avg_lead_days ?? 7),
      rating: supplier.rating == null ? "" : String(supplier.rating),
    });
    setError("");
    setMessage("");
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (form.rating !== "" &&
      (Number(form.rating) < 1 || Number(form.rating) > 5)) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avg_lead_days: Number(form.avg_lead_days),
        rating: form.rating === "" ? null : Number(form.rating),
      };

      if (editing) {
        await axios.put(`${API}/suppliers/${editing.supplier_id}`, payload);
        setMessage("Supplier updated successfully.");
      } else {
        await axios.post(`${API}/suppliers`, payload);
        setMessage("Supplier added successfully.");
      }

      setModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save supplier.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="suppliers-page">
      <div className="page-heading">
        <div>
          <h1>Suppliers</h1>
          <p>Manage supplier relationships and procurement partners.</p>
        </div>
        <button className="primary-btn" onClick={openAdd}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {error && !modal && <div className="supplier-alert error">{error}</div>}
      {message && <div className="supplier-alert success">{message}</div>}

      <div className="supplier-summary" key={`supplier-summary-${animationRun}`}>
        <div className="panel">
          <span>Total Suppliers</span>
          <strong>{suppliers.length}</strong>
          <small><Users size={13} /> Registered partners</small>
        </div>
        <div className="panel">
          <span>Average Rating</span>
          <strong>{averageRating.toFixed(1)}<small>/5</small></strong>
          <small><Star size={13} /> Supplier performance</small>
        </div>
        <div className="panel">
          <span>Average Lead Time</span>
          <strong>
            {suppliers.length
              ? (suppliers.reduce((sum, s) =>
                  sum + Number(s.avg_lead_days || 0), 0) / suppliers.length
                ).toFixed(1)
              : "0"}
            <small>days</small>
          </strong>
          <small><Clock size={13} /> Delivery turnaround</small>
        </div>
      </div>

      <div className="panel suppliers-table-panel" key={`supplier-directory-${animationRun}`}>
        <div className="products-toolbar">
          <div>
            <h2>Supplier Directory</h2>
            <p>View and manage your registered suppliers</p>
          </div>
          <button className="po-refresh" onClick={loadData} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="products-filters">
          <div className="po-search">
            <Search size={15} />
            <input
              placeholder="Search supplier, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="po-empty">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="po-empty">No suppliers found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Lead Time</th>
                  <th>Rating</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(supplier => (
                  <tr key={supplier.supplier_id}>
                    <td>
                      <div className="supplier-name-cell">
                        <div className="supplier-avatar">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{supplier.name}</strong>
                          <small>SUP-{String(supplier.supplier_id).padStart(3, "0")}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-contact">
                        {supplier.email && <span><Mail size={12} /> {supplier.email}</span>}
                        {supplier.phone && <span><Phone size={12} /> {supplier.phone}</span>}
                        {!supplier.email && !supplier.phone && <span>Not provided</span>}
                      </div>
                    </td>
                    <td>{supplier.avg_lead_days} days</td>
                    <td>
                      {supplier.rating == null ? (
                        <span className="supplier-no-rating">Not rated</span>
                      ) : (
                        <span className="supplier-rating">
                          <Star size={13} fill="currentColor" />
                          {Number(supplier.rating).toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td>{new Date(supplier.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <button className="supplier-edit-btn"
                        onClick={() => openEdit(supplier)}>
                        <Pencil size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <form className="product-modal supplier-modal" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <h2>{editing ? "Edit Supplier" : "Add Supplier"}</h2>
                <p>{editing
                  ? "Update supplier information."
                  : "Register a new procurement partner."}</p>
              </div>
              <button type="button" className="modal-close"
                onClick={() => setModal(false)}>
                <X size={17} />
              </button>
            </div>

            {error && <div className="supplier-alert error">{error}</div>}

            <label>Supplier Name *</label>
            <input required maxLength="120"
              placeholder="Enter supplier name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />

            <label>Email Address</label>
            <input type="email" maxLength="160"
              placeholder="supplier@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />

            <label>Phone Number</label>
            <input maxLength="25"
              placeholder="+91-XXXXXXXXXX"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />

            <div className="form-two-columns">
              <div>
                <label>Average Lead Days</label>
                <input required type="number" min="0" step="1"
                  value={form.avg_lead_days}
                  onChange={e => setForm({ ...form, avg_lead_days: e.target.value })} />
              </div>
              <div>
                <label>Supplier Rating (1–5)</label>
                <input type="number" min="1" max="5" step="0.1"
                  placeholder="Optional"
                  value={form.rating}
                  onChange={e => setForm({ ...form, rating: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn"
                onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
