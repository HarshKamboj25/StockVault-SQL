import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard, Package, Warehouse, Boxes, ShoppingCart,
  Truck, ArrowLeftRight, Bell, Search, Plus, TrendingUp,
  AlertTriangle, Coins, Menu, RefreshCw, ChevronRight,
  Activity, CircleCheck, Clock3, UserRound, ChevronDown, Building2, Settings, X, Save,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import "./App.css";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Inventory from "./pages/Inventory";
import PurchaseOrders from "./pages/PurchaseOrders";
import Suppliers from "./pages/Suppliers";
import StockTransfers from "./pages/StockTransfers";
import ReorderAlerts from "./pages/ReorderAlerts";
import Reports from "./pages/Reports";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Products", icon: Package },
  { label: "Warehouses", icon: Warehouse },
  { label: "Inventory", icon: Boxes },
  { label: "Purchase Orders", icon: ShoppingCart },
  { label: "Suppliers", icon: Truck },
  { label: "Stock Transfers", icon: ArrowLeftRight },
  { label: "Reorder Alerts", icon: Bell },
  { label: "Reports", icon: TrendingUp },
];

const money = (value) => Number(value || 0).toLocaleString("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
});

function App() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [hasPlayedDashboardEntrance, setHasPlayedDashboardEntrance] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("profile");
  const [profileMenu, setProfileMenu] = useState(false);
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("stockvault-profile") || "{\"name\":\"Store Owner\",\"role\":\"Owner\",\"email\":\"admin@stockvault.com\",\"phone\":\"\",\"company\":\"StockVault Inventory\",\"industry\":\"Inventory Management\",\"location\":\"India\"}"));

  const loadData = async () => {
    try {
      setError("");
      const [s, p, w, a, o] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/products`),
        axios.get(`${API}/warehouses`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/purchase-orders`),
      ]);
      setStats(s.data.data);
      setProducts(p.data.data || []);
      setWarehouses(w.data.data || []);
      setAlerts(a.data.data || []);
      setOrders(o.data.data || []);
    } catch (err) {
      setError("Could not connect to StockVault API. Make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (active === "Dashboard") {
        setLoading(true);
        await loadData();
      } else {
        setRefreshKey((key) => key + 1);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const saveProfile = (event) => {
    event.preventDefault();
    localStorage.setItem("stockvault-profile", JSON.stringify(profile));
    setProfileOpen(false);
    setProfileMenu(false);
  };

  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => { loadData(); }, []);
  // STOCKVAULT - SHORT LUXURY CURSOR GLINT
  useEffect(() => {
    const canvas = document.querySelector(".cursor-trail");
    if (!canvas || !window.matchMedia("(pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let points = [];
    let frame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);

      points = points.filter(point => now - point.time < 190);

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "screen";

      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const progress = i / (points.length - 1);
        const ageFade = Math.max(0, 1 - (now - b.time) / 190);
        const strength = progress * ageFade;

        if (strength < 0.04) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.globalAlpha = strength * 0.32;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3.8 * progress;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.globalAlpha = strength * 0.8;
        ctx.strokeStyle = "#eafff5";
        ctx.lineWidth = 1.35 * progress;
        ctx.shadowColor = "#d1fae5";
        ctx.shadowBlur = 4;
        ctx.stroke();
      }

      ctx.restore();

      if (points.length > 0) {
        frame = requestAnimationFrame(draw);
      }
    };

    const handleMove = (event) => {
      const now = performance.now();
      const last = points[points.length - 1];

      if (!last || Math.hypot(event.clientX - last.x, event.clientY - last.y) > 2) {
        points.push({ x: event.clientX, y: event.clientY, time: now });
      }

      if (points.length > 11) points.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, width, height);
    };
  }, []);
  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 4800);
    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    const entranceTimer = setTimeout(
      () => setHasPlayedDashboardEntrance(true),
      8600
    );
    return () => clearTimeout(entranceTimer);
  }, []);


  const filteredProducts = useMemo(() => products.filter((p) =>
    [p.name, p.sku, p.category_name].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const chartData = warehouses.map((w) => ({
    name: w.city, stock: Number(w.total_stock_units || 0),
  }));

  const metrics = stats ? [
    { label: "Total Products", value: stats.total_products, note: "Active products", icon: Package, tone: "green" },
    { label: "Warehouses", value: stats.total_warehouses, note: "Operational locations", icon: Warehouse, tone: "blue" },
    { label: "Total Stock Units", value: Number(stats.total_stock_units).toLocaleString("en-IN"), note: "Units across all locations", icon: Boxes, tone: "green" },
    { label: "Inventory Value", value: money(stats.total_inventory_value), note: "Total stock valuation", icon: Coins, tone: "mint" },
    { label: "Low-Stock Alerts", value: stats.low_stock_count, note: "Need replenishment", icon: AlertTriangle, tone: "red" },
    { label: "Pending POs", value: stats.pending_purchase_orders, note: "Awaiting processing", icon: ShoppingCart, tone: "amber" },
  ] : [];

  return (
    <div className="app-shell">
      <canvas className="cursor-trail" aria-hidden="true" />
      <div className="ambient-scene" aria-hidden="true">
  <div className="ambient-object ambient-coin">
    <Coins size={48} strokeWidth={1.3} />
    <span>₹</span>
  </div>

  <div className="ambient-object ambient-cubes">
    <Boxes size={58} strokeWidth={1.2} />
  </div>

  <div className="ambient-object ambient-chart">
    <TrendingUp size={55} strokeWidth={1.3} />
    <div className="ambient-bars"><i /><i /><i /><i /><i /></div>
  </div>

  <div className="ambient-object ambient-warehouse">
    <Warehouse size={48} strokeWidth={1.3} />
  </div>

  <div className="ambient-object ambient-database">
    <div className="database-cylinder"><span /><span /><span /></div>
  </div>

  <div className="ambient-orbit orbit-one" />
  <div className="ambient-orbit orbit-two" />
  <div className="ambient-particle particle-one" />
  <div className="ambient-particle particle-two" />
  <div className="ambient-particle particle-three" />
</div>
      {showIntro && (
        <div className="stockvault-intro">
          <div className="intro-glow intro-glow-one" />
          <div className="intro-glow intro-glow-two" />

          <div className="intro-content">
            <div className="intro-logo">
              <Boxes size={48} strokeWidth={1.7} />
              <span className="intro-logo-shine" />
            </div>

            <div className="intro-brand-name">Stock<span>Vault</span></div>
            <div className="intro-brand-subtitle">INVENTORY MANAGEMENT</div>

            <div className="intro-divider" />

            <h1 className="intro-tagline">Control Every Move.</h1>
            <p className="intro-description">Smart Inventory. Smarter Decisions.</p>

            <div className="intro-loading">
              <div className="intro-progress">
                <span />
              </div>
              <span className="intro-loading-text">INITIALIZING YOUR WORKSPACE</span>
            </div>
          </div>

          <div className="intro-footer">POWERED BY STOCKVAULT SQL</div>
        </div>
      )}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Boxes size={25} /></div>
          <div><strong>StockVault</strong><span>INVENTORY MANAGEMENT</span></div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-link ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setMobileMenu(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "Reorder Alerts" && alerts.length > 0 && <span className="nav-count">{alerts.length}</span>}
            </button>
          ))}
        </nav>
        <button className="sidebar-bottom profile-trigger" onClick={() => setProfileMenu(!profileMenu)}>
  <div className="profile-avatar"><UserRound size={19} /></div>
  <div className="profile-copy"><strong>{profile.name}</strong><span>{profile.company}</span></div>
  <ChevronDown size={15} className="profile-chevron" />
</button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
          <div className="breadcrumb">Workspace <ChevronRight size={14} /> <strong>{active}</strong></div>
          <div className="top-actions">
            <span className="system-status"><i /> Live database</span>
            <button className="icon-button" title="Refresh data" onClick={handleRefresh} disabled={refreshing}><RefreshCw size={17} className={refreshing ? "refresh-spinning" : ""} /></button>
            <button className="icon-button notification-button" title="Reorder alerts" onClick={() => setActive("Reorder Alerts")}><Bell size={18} />{alerts.length > 0 && <i />}</button>
            <button className="top-avatar profile-top-trigger" title="Admin profile" onClick={() => setProfileMenu(!profileMenu)}><UserRound size={19} /></button>
          </div>
        </header>

        {profileMenu && (
  <div className="profile-menu">
    <div className="profile-menu-heading">
      <div className="profile-avatar"><UserRound size={19} /></div>
      <div>
        <strong>{profile.name}</strong>
        <span>{profile.role} &#183; {profile.company}</span>
      </div>
    </div>
    <div className="profile-menu-divider" />
    <button className="profile-menu-item" onClick={() => { setProfileTab("profile"); setProfileOpen(true); setProfileMenu(false); }}>
      <UserRound size={17} /> Edit Profile
    </button>
    <button className="profile-menu-item" onClick={() => { setProfileTab("company"); setProfileOpen(true); setProfileMenu(false); }}>
      <Building2 size={17} /> Company Details
    </button>
    <button className="profile-menu-item" onClick={() => { setProfileTab("settings"); setProfileOpen(true); setProfileMenu(false); }}>
      <Settings size={17} /> Account Settings
    </button>
  </div>
)}
        <div className={`page-content ${active === "Dashboard" && !hasPlayedDashboardEntrance ? "workspace-enter" : ""}`} key={`${active}-${refreshKey}`}>
          {active === "Reports" ? <Reports /> : active === "Products" ? <Products /> : active === "Warehouses" ? <Warehouses /> : active === "Inventory" ? <Inventory /> : active === "Purchase Orders" ? <PurchaseOrders /> : active === "Suppliers" ? <Suppliers /> : active === "Stock Transfers" ? <StockTransfers /> : active === "Reorder Alerts" ? <ReorderAlerts /> : <>
          <section className="page-heading">
            <div><div className="eyebrow">INVENTORY CONTROL CENTER</div><h1>Good to see you, Admin <span>&#10022;</span></h1><p>Your inventory at a glance. Everything in one place.</p></div>
            <div className="heading-date"><Activity size={16} /> Real-time overview</div>
          </section>

          {error && <div className="error-banner"><AlertTriangle size={18} />{error}<button onClick={loadData}>Retry</button></div>}
          {loading && <div className="loading-banner">Connecting to your inventory database&#8230;</div>}

          <section className="metric-grid">
            {metrics.map(({ label, value, note, icon: Icon, tone }) => (
              <article className="metric-card" key={label}>
                <div className={`metric-icon ${tone}`}><Icon size={20} /></div>
                <div className="metric-copy"><span>{label}</span><strong>{value ?? "0"}</strong><small>{note}</small></div>
              </article>
            ))}
          </section>

          <section className="overview-grid">
            <article className="panel stock-panel">
              <div className="panel-heading"><div><h2>Stock distribution</h2><p>Units currently held by warehouse</p></div><span className="panel-icon"><TrendingUp size={18} /></span></div>
              <div className="chart-wrap">
                {chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#07965b" stopOpacity={0.22} /><stop offset="95%" stopColor="#07965b" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="#edf1ef" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#82908a", fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#82908a", fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7eeea", boxShadow: "0 8px 24px #172a2014" }} /><Area type="monotone" dataKey="stock" name="Stock units" stroke="#07965b" strokeWidth={3} fill="url(#stockFill)" /></AreaChart></ResponsiveContainer> : <div className="empty-chart">Warehouse data will appear here.</div>}
              </div>
              <div className="chart-foot"><span><i /> Current stock units</span><strong>{Number(stats?.total_stock_units || 0).toLocaleString("en-IN")} units</strong></div>
            </article>

            <article className="panel warehouse-panel">
              <div className="panel-heading"><div><h2>Warehouse overview</h2><p>Stock and valuation by location</p></div><Warehouse className="heading-green" size={20} /></div>
              <div className="warehouse-list">
                {warehouses.map((w) => <div className="warehouse-row" key={w.warehouse_id}><div className="warehouse-symbol"><Warehouse size={19} /></div><div className="warehouse-info"><strong>{w.name}</strong><span>{w.city} · {w.product_types} product types</span></div><div className="warehouse-numbers"><strong>{Number(w.total_stock_units).toLocaleString("en-IN")} units</strong><span>{money(w.inventory_value)}</span></div></div>)}
                {!loading && warehouses.length === 0 && <div className="empty-state">No warehouses found.</div>}
              </div>
            </article>

            <article className="panel alerts-panel">
              <div className="panel-heading"><div><h2>Low-stock alerts</h2><p>Items that need attention</p></div><span className="alert-counter">{alerts.length}</span></div>
              <div className="alert-list">
                {alerts.slice(0, 4).map((a) => <div className="alert-row" key={a.alert_id}><div className="alert-symbol"><AlertTriangle size={17} /></div><div className="alert-info"><strong>{a.product_name}</strong><span>{a.warehouse_name}</span></div><span className="stock-ratio">{a.current_qty} / {a.reorder_threshold}</span></div>)}
                {!loading && alerts.length === 0 && <div className="empty-state"><CircleCheck size={20} /> All stock levels look healthy.</div>}
              </div>
              <button className="text-action" onClick={() => setActive("Reorder Alerts")}>View all alerts <ChevronRight size={15} /></button>
            </article>
          </section>

          <section className="panel inventory-panel">
            <div className="inventory-heading"><div><div className="panel-heading"><div><h2>Inventory overview</h2><p>Products, pricing and stock availability</p></div></div></div><div className="inventory-actions"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, SKU or category..." /></div><span className="record-count">{filteredProducts.length} products</span></div></div>
            <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>UNIT PRICE</th><th>REORDER LEVEL</th><th>TOTAL STOCK</th><th>STATUS</th></tr></thead><tbody>
              {filteredProducts.map((p) => { const low = Number(p.total_stock) <= Number(p.reorder_threshold); return <tr key={p.product_id}><td><div className="product-cell"><div className="product-avatar"><Package size={18} /></div><strong>{p.name}</strong></div></td><td className="sku-cell">{p.sku}</td><td><span className="category-pill">{p.category_name}</span></td><td className="price-cell">{money(p.unit_price)}</td><td>{p.reorder_threshold}</td><td><strong>{Number(p.total_stock).toLocaleString("en-IN")}</strong></td><td><span className={`status-pill ${low ? "low" : "healthy"}`}><i />{low ? "Low stock" : "In stock"}</span></td></tr>; })}
              {!loading && filteredProducts.length === 0 && <tr><td colSpan="7" className="empty-table">No matching products found.</td></tr>}
            </tbody></table></div>
          </section>

          <footer className="footer"><span>© 2026 StockVault Inventory Management</span><span><i /> Connected to PostgreSQL</span></footer>
          </>}
        </div>
        {profileOpen && (
          <div className="profile-modal-backdrop" onClick={() => setProfileOpen(false)}>
            <section className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <div>
                  <span className="eyebrow">STOCKVAULT ACCOUNT</span>
                  <h2>Account Management</h2>
                  <p>Manage your profile and business information.</p>
                </div>
                <button type="button" className="profile-close" onClick={() => setProfileOpen(false)}><X size={20} /></button>
              </div>

              <div className="profile-tabs">
                <button type="button" className={profileTab === "profile" ? "selected" : ""} onClick={() => setProfileTab("profile")}><UserRound size={16} /> My Profile</button>
                <button type="button" className={profileTab === "company" ? "selected" : ""} onClick={() => setProfileTab("company")}><Building2 size={16} /> Company</button>
                <button type="button" className={profileTab === "settings" ? "selected" : ""} onClick={() => setProfileTab("settings")}><Settings size={16} /> Settings</button>
              </div>

              <form onSubmit={saveProfile}>
                {profileTab === "profile" && (
                  <div className="profile-form-grid">
                    <label>Full Name<input value={profile.name || ""} onChange={(e) => updateProfile("name", e.target.value)} placeholder="Enter your name" required /></label>
                    <label>Role / Designation<input value={profile.role || ""} onChange={(e) => updateProfile("role", e.target.value)} placeholder="Store Owner" /></label>
                    <label>Email Address<input type="email" value={profile.email || ""} onChange={(e) => updateProfile("email", e.target.value)} placeholder="admin@stockvault.com" /></label>
                    <label>Phone Number<input value={profile.phone || ""} onChange={(e) => updateProfile("phone", e.target.value)} placeholder="Enter phone number" /></label>
                  </div>
                )}

                {profileTab === "company" && (
                  <div className="profile-form-grid">
                    <label>Company / Store Name<input value={profile.company || ""} onChange={(e) => updateProfile("company", e.target.value)} placeholder="StockVault Inventory" required /></label>
                    <label>Industry<input value={profile.industry || ""} onChange={(e) => updateProfile("industry", e.target.value)} placeholder="Inventory Management" /></label>
                    <label>Business Location<input value={profile.location || ""} onChange={(e) => updateProfile("location", e.target.value)} placeholder="City, Country" /></label>
                  </div>
                )}

                {profileTab === "settings" && (
                  <div className="profile-settings-content">
                    <div><strong>Account Status</strong><span>Active · Local administrator profile</span></div>
                    <div><strong>Data Storage</strong><span>Profile preferences are saved in this browser.</span></div>
                    <div><strong>Database</strong><span>PostgreSQL · StockVault</span></div>
                  </div>
                )}

                <div className="profile-modal-footer">
  {profileTab === "settings" ? (
    <button type="button" className="profile-cancel" onClick={() => setProfileOpen(false)}>Close</button>
  ) : (
    <>
      <button type="button" className="profile-cancel" onClick={() => setProfileOpen(false)}>Cancel</button>
      <button type="submit" className="profile-save"><Save size={16} /> Save Changes</button>
    </>
  )}
</div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;























