import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Plus, Trash2, LogOut, ShoppingBag, Boxes,
  TrendingUp, Loader2, Tag, Check, X, ShieldAlert,
  ListFilter, RefreshCw, Layers, Award, Percent, Image as ImageIcon,
  User, Edit
} from "lucide-react";
import {
  getCategories, addCategory, editCategory, deleteCategory,
  getProducts, addProduct, editProduct, updateProductStock, deleteProduct,
  getBrands, addBrand, editBrand, deleteBrand,
  getOrders, updateOrderStatus, getUsers,
  toggleUserAccountStatus, forceResetSession, getCustomerSessionCount,
  getCustomerLoginHistory, getCustomerAuditLogs
} from "../lib/actions";

export const Route = createFileRoute("/admin-portal-nadeem-786")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Nadeem Traders" },
      { name: "robots", content: "noindex, nofollow" }
    ],
  }),
  component: AdminPortal,
});

const PIN = "786786";

const getAdminDataCache = () => {
  if (typeof window === "undefined") {
    return { categories: null, products: null, brands: null, orders: null, customers: null };
  }
  if (!(window as any).__adminDataCache) {
    (window as any).__adminDataCache = {
      categories: null,
      products: null,
      brands: null,
      orders: null,
      customers: null,
    };
  }
  return (window as any).__adminDataCache;
};

function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "categories" | "brands" | "customers">("orders");

  // Data states
  const [categories, setCategories] = useState<any[]>(() => getAdminDataCache().categories || []);
  const [products, setProducts] = useState<any[]>(() => getAdminDataCache().products || []);
  const [brands, setBrands] = useState<any[]>(() => getAdminDataCache().brands || []);
  const [orders, setOrders] = useState<any[]>(() => getAdminDataCache().orders || []);
  const [customers, setCustomers] = useState<any[]>(() => getAdminDataCache().customers || []);

  // User log modal & session count states
  const [selectedCustomerForLogs, setSelectedCustomerForLogs] = useState<any | null>(null);
  const [customerLogHistory, setCustomerLogHistory] = useState<any[]>([]);
  const [customerAuditLogs, setCustomerAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sessionCounts, setSessionCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (activeTab === "customers" && customers.length > 0) {
      const fetchSessionCounts = async () => {
        const counts: Record<number, number> = {};
        await Promise.all(
          customers.map(async (c) => {
            try {
              const count = await getCustomerSessionCount({ data: { userId: c.id } });
              counts[c.id] = count;
            } catch (e) {
              counts[c.id] = 0;
            }
          })
        );
        setSessionCounts(counts);
      };
      fetchSessionCounts();
    }
  }, [activeTab, customers]);

  // Loading states
  const [isLoading, setIsLoading] = useState(() => {
    const cache = getAdminDataCache();
    return !(cache.categories && cache.products && cache.brands && cache.orders && cache.customers);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);

  // Form states
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatImage, setNewCatImage] = useState("");

  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandImage, setNewBrandImage] = useState("");

  const [newProd, setNewProd] = useState({
    name: "",
    brand: "",
    weight: "",
    price: "",
    old_price: "",
    discount: "",
    emoji: "🌾",
    stock: true,
    category_id: "",
    wholesale_price: "",
    wholesale_min_qty: "5",
    image_url: "",
  });

  // Check sessionStorage for persistent auth during session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch all data
  const fetchData = async (forceSpinner = false) => {
    const cache = getAdminDataCache();
    if (forceSpinner || !(cache.categories && cache.products && cache.brands && cache.orders && cache.customers)) {
      setIsLoading(true);
    }
    try {
      const [catsRes, prodsRes, brandsRes, ordersRes, usersRes] = await Promise.all([
        getCategories(),
        getProducts(),
        getBrands(),
        getOrders(),
        getUsers(),
      ]);
      cache.categories = catsRes;
      cache.products = prodsRes;
      cache.brands = brandsRes;
      cache.orders = ordersRes;
      cache.customers = usersRes;

      setCategories(catsRes);
      setProducts(prodsRes);
      setBrands(brandsRes);
      setOrders(ordersRes);
      setCustomers(usersRes);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_auth", "true");
      }
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_auth");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.account_status === "Disabled" ? "Enabled" : "Disabled";
    const confirm = window.confirm(`Are you sure you want to change account status for ${user.name} to ${newStatus}?`);
    if (!confirm) return;
    try {
      await toggleUserAccountStatus({ data: { userId: user.id, status: newStatus } });
      // Reload users list
      const usersRes = await getUsers();
      setCustomers(usersRes);
      getAdminDataCache().customers = usersRes;
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceLogout = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to force logout all sessions for ${user.name}?`);
    if (!confirm) return;
    try {
      await forceResetSession({ data: { userId: user.id } });
      // Reload session count
      const count = await getCustomerSessionCount({ data: { userId: user.id } });
      setSessionCounts(prev => ({ ...prev, [user.id]: count }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewUserLogs = async (user: any) => {
    setSelectedCustomerForLogs(user);
    setLogsLoading(true);
    try {
      const [hist, logs] = await Promise.all([
        getCustomerLoginHistory({ data: { userId: user.id } }),
        getCustomerAuditLogs({ data: { userId: user.id } })
      ]);
      setCustomerLogHistory(hist);
      setCustomerAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  // FileReader helpers for base64 conversions
  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProd((prev) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct((prev: any) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCategory((prev: any) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCatImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditBrandFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingBrand((prev: any) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBrandImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setIsSubmitting(true);
    try {
      await addCategory({
        data: {
          name: newCatName,
          icon: newCatIcon,
          image_url: newCatImage || undefined,
        },
      });
      // reload categories
      const catsRes = await getCategories();
      setCategories(catsRes);
      getAdminDataCache().categories = catsRes;
      setNewCatName("");
      setNewCatImage("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category? All products under it will be deleted.")) return;
    try {
      await deleteCategory({ data: { id } });
      setCategories((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        getAdminDataCache().categories = filtered;
        return filtered;
      });
      setProducts((prev) => {
        const filtered = prev.filter((p) => p.category_id !== id);
        getAdminDataCache().products = filtered;
        return filtered;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Category Handler
  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) return;
    setIsSubmitting(true);
    try {
      await editCategory({
        data: {
          id: editingCategory.id,
          name: editingCategory.name,
          icon: editingCategory.icon,
          image_url: editingCategory.image_url || undefined,
        }
      });
      // reload categories and products (since products join category name)
      const [catsRes, prodsRes] = await Promise.all([
        getCategories(),
        getProducts()
      ]);
      setCategories(catsRes);
      setProducts(prodsRes);
      getAdminDataCache().categories = catsRes;
      getAdminDataCache().products = prodsRes;
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product Handler
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.brand || !editingProduct.weight || !editingProduct.price || !editingProduct.category_id) {
      alert("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await editProduct({
        data: {
          id: editingProduct.id,
          name: editingProduct.name,
          brand: editingProduct.brand,
          weight: editingProduct.weight,
          price: parseInt(editingProduct.price),
          old_price: editingProduct.old_price ? parseInt(editingProduct.old_price) : undefined,
          discount: editingProduct.discount ? parseInt(editingProduct.discount) : 0,
          emoji: editingProduct.emoji,
          stock: editingProduct.stock,
          category_id: parseInt(editingProduct.category_id),
          wholesale_price: editingProduct.wholesale_price ? parseInt(editingProduct.wholesale_price) : undefined,
          wholesale_min_qty: editingProduct.wholesale_min_qty ? parseInt(editingProduct.wholesale_min_qty) : 1,
          image_url: editingProduct.image_url || undefined,
        }
      });
      // reload products to get populated category names
      const prodsRes = await getProducts();
      setProducts(prodsRes);
      getAdminDataCache().products = prodsRes;
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Brand Handler
  const handleEditBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name) return;
    setIsSubmitting(true);
    try {
      await editBrand({
        data: {
          id: editingBrand.id,
          name: editingBrand.name,
          image_url: editingBrand.image_url || undefined,
        }
      });
      // reload brands
      const brandsRes = await getBrands();
      setBrands(brandsRes);
      getAdminDataCache().brands = brandsRes;
      setEditingBrand(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Brand Handler
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    setIsSubmitting(true);
    try {
      await addBrand({
        data: {
          name: newBrandName,
          image_url: newBrandImage || undefined,
        },
      });
      // reload brands
      const brandsRes = await getBrands();
      setBrands(brandsRes);
      getAdminDataCache().brands = brandsRes;
      setNewBrandName("");
      setNewBrandImage("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: number) => {
    if (!confirm("Delete this brand?")) return;
    try {
      await deleteBrand({ data: { id } });
      setBrands((prev) => {
        const filtered = prev.filter((b) => b.id !== id);
        getAdminDataCache().brands = filtered;
        return filtered;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product Handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.brand || !newProd.weight || !newProd.price || !newProd.category_id) {
      alert("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await addProduct({
        data: {
          name: newProd.name,
          brand: newProd.brand,
          weight: newProd.weight,
          price: parseInt(newProd.price),
          old_price: newProd.old_price ? parseInt(newProd.old_price) : undefined,
          discount: newProd.discount ? parseInt(newProd.discount) : 0,
          emoji: newProd.emoji,
          stock: newProd.stock,
          category_id: parseInt(newProd.category_id),
          wholesale_price: newProd.wholesale_price ? parseInt(newProd.wholesale_price) : undefined,
          wholesale_min_qty: newProd.wholesale_min_qty ? parseInt(newProd.wholesale_min_qty) : 1,
          image_url: newProd.image_url || undefined,
        },
      });
      // reload products to get populated category names
      const prodsRes = await getProducts();
      setProducts(prodsRes);
      getAdminDataCache().products = prodsRes;
      setNewProd({
        name: "",
        brand: "",
        weight: "",
        price: "",
        old_price: "",
        discount: "",
        emoji: "🌾",
        stock: true,
        category_id: "",
        wholesale_price: "",
        wholesale_min_qty: "5",
        image_url: "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Stock status
  const handleToggleStock = async (id: number, currentStock: boolean) => {
    try {
      await updateProductStock({ data: { id, stock: !currentStock } });
      setProducts((prev) => {
        const mapped = prev.map((p) => (p.id === id ? { ...p, stock: !currentStock } : p));
        getAdminDataCache().products = mapped;
        return mapped;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct({ data: { id } });
      setProducts((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        getAdminDataCache().products = filtered;
        return filtered;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (id: number, newStatus: string) => {
    try {
      await updateOrderStatus({ data: { id, status: newStatus } });
      setOrders((prev) => {
        const mapped = prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
        getAdminDataCache().orders = mapped;
        return mapped;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate statistics
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Authentication PIN screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground admin-portal">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-glow mb-6">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Nadeem Traders</h1>
            <p className="mt-2 text-sm text-primary font-semibold tracking-wider uppercase">Admin Portal Gate</p>
            <p className="mt-1 text-xs text-muted-foreground">Authorized access only. Enter secure PIN.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="pin" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Admin Code PIN
              </label>
              <input
                id="pin"
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                className="mt-2 w-full rounded-2xl border border-border bg-background py-3.5 text-center text-xl font-bold tracking-[0.4em] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {pinError && (
              <p className="text-center text-xs font-bold text-rose-500">
                ❌ Invalid security PIN code. Try again.
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-white shadow-soft transition hover:brightness-105"
            >
              Verify Secure Gate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans admin-portal">
      {/* Header */}
      <header className="border-b border-emerald-950/60 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Nadeem Traders Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              title="Refresh Data"
              className="rounded-xl border border-emerald-900/80 bg-slate-900 p-2 hover:bg-slate-800 text-slate-300 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-900/50 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/80 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Statistics Panels */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Total Revenue" value={`Rs. ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="emerald" />
          <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="teal" />
          <StatCard title="Active Products" value={products.filter((p) => p.stock).length} icon={Boxes} color="blue" />
          <StatCard title="Total Customers" value={customers.length} icon={User} color="indigo" />
        </section>

        {/* Navigation Tabs */}
        <div className="mt-8 flex border-b border-emerald-950 overflow-x-auto">
          {[
            { id: "orders", label: "Orders Manager", icon: ShoppingBag },
            { id: "products", label: "Products DB", icon: Boxes },
            { id: "categories", label: "Categories Setup", icon: Layers },
            { id: "brands", label: "Brands Scroll", icon: Award },
            { id: "customers", label: "Registered Customers", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-400 text-emerald-400 bg-emerald-950/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              {/* ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Incoming Customer Orders</h2>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-emerald-950 bg-slate-900/10">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-950 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Customer Info</th>
                          <th className="px-6 py-4">Shipping Location</th>
                          <th className="px-6 py-4">Order Items</th>
                          <th className="px-6 py-4">Amount (Rs)</th>
                          <th className="px-6 py-4">Invoice Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/40 text-slate-200">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No customer orders recorded yet.</td>
                          </tr>
                        ) : (
                          orders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-900/20 transition">
                              <td className="px-6 py-4 font-black text-emerald-400">#{o.id}</td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-100">{o.customer_name}</div>
                                <div className="text-xs text-slate-400">{o.customer_email}</div>
                                <div className="text-[10px] text-emerald-300 font-mono mt-0.5">{o.customer_phone}</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{o.shipping_address}</p>
                              </td>
                              <td className="px-6 py-4">
                                <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
                                  {o.items?.map((item: any, idx: number) => (
                                    <li key={idx} className="truncate">
                                      <span className="font-bold text-slate-200">{item.product_name}</span> x {item.quantity}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td className="px-6 py-4 font-extrabold text-white text-base">Rs. {o.total_amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <select
                                  value={o.status}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                  className={`rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-bold focus:outline-none ${
                                    o.status === "Pending" ? "bg-amber-950/80 text-amber-300 border-amber-900/50" :
                                    o.status === "Packing" ? "bg-blue-950/80 text-blue-300 border-blue-900/50" :
                                    o.status === "Shipped" ? "bg-purple-950/80 text-purple-300 border-purple-900/50" :
                                    o.status === "Delivered" ? "bg-emerald-950/80 text-emerald-300 border-emerald-900/50" :
                                    "bg-rose-950/80 text-rose-300 border-rose-900/50"
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Packing">Packing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === "products" && (
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Add Product Form */}
                  <div className="rounded-3xl border border-emerald-950 bg-slate-900/20 p-6">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-6">
                      <Plus className="h-5 w-5" /> Add New Ration Product
                    </h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                        <input
                          type="text"
                          required
                          value={newProd.name}
                          onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                          placeholder="e.g. Premium White Chana"
                          className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Brand</label>
                          <input
                            type="text"
                            required
                            value={newProd.brand}
                            onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                            placeholder="e.g. Shan"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Weight / Spec</label>
                          <input
                            type="text"
                            required
                            value={newProd.weight}
                            onChange={(e) => setNewProd({ ...newProd, weight: e.target.value })}
                            placeholder="e.g. 1 KG"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Price (Rs)</label>
                          <input
                            type="number"
                            required
                            value={newProd.price}
                            onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                            placeholder="450"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Old Price</label>
                          <input
                            type="number"
                            value={newProd.old_price}
                            onChange={(e) => setNewProd({ ...newProd, old_price: e.target.value })}
                            placeholder="520"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Discount %</label>
                          <input
                            type="number"
                            value={newProd.discount}
                            onChange={(e) => setNewProd({ ...newProd, discount: e.target.value })}
                            placeholder="15"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Wholesale Rate</label>
                          <input
                            type="number"
                            value={newProd.wholesale_price}
                            onChange={(e) => setNewProd({ ...newProd, wholesale_price: e.target.value })}
                            placeholder="e.g. 400"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Min Bulk Qty</label>
                          <input
                            type="number"
                            value={newProd.wholesale_min_qty}
                            onChange={(e) => setNewProd({ ...newProd, wholesale_min_qty: e.target.value })}
                            placeholder="5"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Fallback Emoji</label>
                          <input
                            type="text"
                            value={newProd.emoji}
                            onChange={(e) => setNewProd({ ...newProd, emoji: e.target.value })}
                            placeholder="🌾"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Product Category</label>
                          <select
                            required
                            value={newProd.category_id}
                            onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500"
                          >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Product Picture Upload</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductFileChange}
                          className="mt-1.5 w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                        />
                        {newProd.image_url && (
                          <div className="mt-2 text-[10px] text-emerald-400 font-semibold">
                            ✓ Image file loaded (Base64 ready)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          id="stock"
                          checked={newProd.stock}
                          onChange={(e) => setNewProd({ ...newProd, stock: e.target.checked })}
                          className="rounded border-emerald-900 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="stock" className="text-xs font-bold text-slate-300">Product in Stock (Available)</label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Product
                      </button>
                    </form>
                  </div>

                  {/* List Products */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold">Ration Catalog Products</h3>
                    <div className="overflow-hidden rounded-3xl border border-emerald-950 bg-slate-900/10">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-emerald-950 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Specifications</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Wholesale Rate</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-950/40 text-slate-200">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-900/20 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-slate-800 text-xl font-bold overflow-hidden border border-emerald-900/30">
                                    {p.image_url ? (
                                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                    ) : (
                                      p.emoji
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-100">{p.name}</div>
                                    <div className="text-[10px] text-slate-400">{p.brand} • <span className="text-emerald-400">{p.category_name}</span></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-semibold">{p.weight}</td>
                              <td className="px-6 py-4 font-bold text-slate-100">
                                Rs. {p.price.toLocaleString()}
                                {p.old_price && <div className="text-[10px] text-slate-500 line-through">Rs. {p.old_price.toLocaleString()}</div>}
                              </td>
                              <td className="px-6 py-4">
                                {p.wholesale_price ? (
                                  <div>
                                    <span className="font-extrabold text-emerald-400">Rs. {p.wholesale_price}/kg</span>
                                    <div className="text-[9px] text-slate-400">Min Order: {p.wholesale_min_qty} qty</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleStock(p.id, p.stock)}
                                  className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition-all ${
                                    p.stock
                                      ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                                      : "bg-rose-950 text-rose-400 border border-rose-900"
                                  }`}
                                >
                                  {p.stock ? "In Stock" : "Out of Stock"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setEditingProduct(p)}
                                    className="text-amber-400 hover:text-amber-300 transition"
                                    title="Edit Product"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="text-rose-400 hover:text-rose-300 transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === "categories" && (
                <div className="grid gap-8 md:grid-cols-3">
                  {/* Add Category */}
                  <div className="rounded-3xl border border-emerald-950 bg-slate-900/20 p-6">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-6">
                      <Plus className="h-5 w-5" /> Add Category
                    </h3>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Category Name</label>
                        <input
                          type="text"
                          required
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Pulses (Daal)"
                          className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Category Icon</label>
                          <input
                            type="text"
                            required
                            value={newCatIcon}
                            onChange={(e) => setNewCatIcon(e.target.value)}
                            placeholder="📦"
                            className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500 text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Category Image Upload (Optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryFileChange}
                          className="mt-1.5 w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                        />
                        {newCatImage && (
                          <div className="mt-2 text-[10px] text-emerald-400 font-semibold">
                            ✓ Category Image loaded (Base64 ready)
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Category
                      </button>
                    </form>
                  </div>

                  {/* List Categories */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold">Configured Store Categories</h3>
                    <p className="text-xs text-slate-400">Deleting a category automatically deletes all products under it.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-950 bg-slate-900/20 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 grid place-items-center rounded-xl bg-slate-800 text-xl font-bold overflow-hidden border border-emerald-900/30">
                              {c.image_url ? (
                                <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                              ) : (
                                c.icon
                              )}
                            </div>
                            <span className="font-bold text-sm text-slate-200">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingCategory(c)}
                              className="rounded-xl p-2 hover:bg-slate-800 text-amber-400 transition"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="rounded-xl p-2 hover:bg-slate-800 text-rose-400 transition"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BRANDS TAB */}
              {activeTab === "brands" && (
                <div className="grid gap-8 md:grid-cols-3">
                  {/* Add Brand */}
                  <div className="rounded-3xl border border-emerald-950 bg-slate-900/20 p-6">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-6">
                      <Plus className="h-5 w-5" /> Add Popular Brand
                    </h3>
                    <form onSubmit={handleAddBrand} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Brand Name</label>
                        <input
                          type="text"
                          required
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          placeholder="e.g. National Foods"
                          className="mt-1.5 w-full rounded-xl border border-emerald-900/60 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Brand Logo Upload (Optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBrandFileChange}
                          className="mt-1.5 w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                        />
                        {newBrandImage && (
                          <div className="mt-2 text-[10px] text-emerald-400 font-semibold">
                            ✓ Brand Logo loaded (Base64 ready)
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Brand
                      </button>
                    </form>
                  </div>

                  {/* List Brands */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold">Featured Brands Marquee</h3>
                    <p className="text-xs text-slate-400">These brands broadcast from right to left dynamically on the homepage.</p>
                    <div className="flex flex-wrap gap-3">
                      {brands.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-3 rounded-2xl border border-emerald-950 bg-slate-900/20 px-4 py-2.5"
                        >
                          {b.image_url ? (
                            <img src={b.image_url} alt={b.name} className="h-6 w-16 object-contain bg-white/10 rounded px-1.5" />
                          ) : (
                            <span className="font-bold text-sm text-emerald-400">{b.name}</span>
                          )}
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => setEditingBrand(b)}
                              className="text-amber-400 hover:text-amber-300 transition"
                              title="Edit Brand"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(b.id)}
                              className="text-rose-400 hover:text-rose-300 transition"
                              title="Delete Brand"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOMERS TAB */}
              {activeTab === "customers" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-emerald-400">Registered Store Customers</h3>
                  <p className="text-xs text-slate-400">View and manage customer registrations, total spend, reward points, active sessions, disable accounts, or force logout.</p>
                  
                  <div className="overflow-hidden rounded-3xl border border-emerald-950 bg-slate-900/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-950 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">Avatar</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3">Reg Date</th>
                          <th className="px-4 py-3">Total Spend</th>
                          <th className="px-4 py-3">Reward Points</th>
                          <th className="px-4 py-3">Active Sessions</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/40 text-slate-200">
                        {customers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                              No registered customers found.
                            </td>
                          </tr>
                        ) : (
                          customers.map((c) => {
                            const activeSessions = sessionCounts[c.id] || 0;
                            return (
                              <tr key={c.id} className="hover:bg-slate-900/20 transition">
                                <td className="px-4 py-3">
                                  <img
                                    src={c.picture || "https://lh3.googleusercontent.com/a/default-user"}
                                    alt={c.name}
                                    className="h-8 w-8 rounded-full object-cover border border-emerald-900/60"
                                  />
                                </td>
                                <td className="px-4 py-3 font-bold">{c.name}</td>
                                <td className="px-4 py-3 text-slate-300 font-mono">{c.email}</td>
                                <td className="px-4 py-3 text-slate-400">
                                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A"}
                                </td>
                                <td className="px-4 py-3 font-bold text-emerald-400">Rs. {(c.total_spending || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-amber-400 font-bold">{c.reward_points || 0}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                                    activeSessions > 0 ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-slate-950 text-slate-500"
                                  }`}>
                                    {activeSessions} Active
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold ${
                                    c.account_status === "Disabled" 
                                      ? "bg-rose-950 text-rose-400 border border-rose-900" 
                                      : "bg-emerald-950 text-emerald-400 border border-emerald-900"
                                  }`}>
                                    {c.account_status || "Enabled"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => handleToggleStatus(c)}
                                    className={`rounded-lg px-2.5 py-1 font-bold ${
                                      c.account_status === "Disabled" 
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white" 
                                        : "bg-rose-950 text-rose-400 border border-rose-900 hover:bg-rose-900 hover:text-white"
                                    }`}
                                  >
                                    {c.account_status === "Disabled" ? "Enable" : "Disable"}
                                  </button>
                                  <button
                                    onClick={() => handleForceLogout(c)}
                                    disabled={activeSessions === 0}
                                    className="rounded-lg bg-slate-950 border border-emerald-900/30 text-slate-300 px-2.5 py-1 font-bold hover:bg-slate-900 disabled:opacity-50"
                                  >
                                    Force Logout
                                  </button>
                                  <button
                                    onClick={() => handleViewUserLogs(c)}
                                    className="rounded-lg bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 px-2.5 py-1 font-bold hover:bg-primary hover:text-white"
                                  >
                                    View Logs
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Customer Logs Overlay Modal */}
                  {selectedCustomerForLogs && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <div className="relative w-full max-w-2xl bg-slate-950 border border-emerald-900/40 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-left">
                        <button
                          onClick={() => setSelectedCustomerForLogs(null)}
                          className="absolute right-4 top-4 rounded-xl p-2 bg-slate-900 border border-emerald-900/20 text-slate-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        
                        <h3 className="text-lg font-black text-white border-b border-emerald-950 pb-3 mb-6">
                          Logs & Activity Audit for {selectedCustomerForLogs.name}
                        </h3>

                        {logsLoading ? (
                          <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Login History */}
                            <div>
                              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2.5">Device Login History</h4>
                              {customerLogHistory.length === 0 ? (
                                <p className="text-xs text-slate-500 bg-slate-900/30 p-4 rounded-xl border border-emerald-950">No logins registered.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {customerLogHistory.map((h) => (
                                    <div key={h.id} className="flex justify-between items-center text-xs bg-slate-900/40 p-2.5 rounded-xl border border-emerald-900/10">
                                      <div>
                                        <span className="font-bold text-slate-300">{h.ip_address}</span>
                                        <span className="text-[10px] text-slate-500 block">{h.device} • {h.browser}</span>
                                      </div>
                                      <span className="text-emerald-400 font-bold">{new Date(h.login_time).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Audit Logs */}
                            <div className="border-t border-emerald-950 pt-5">
                              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2.5">Security Audit Logs</h4>
                              {customerAuditLogs.length === 0 ? (
                                <p className="text-xs text-slate-500 bg-slate-900/30 p-4 rounded-xl border border-emerald-950">No security audit logs registered.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {customerAuditLogs.map((l) => (
                                    <div key={l.id} className="flex justify-between items-center text-xs bg-slate-900/40 p-2.5 rounded-xl border border-emerald-900/10">
                                      <div>
                                        <span className="font-bold text-slate-300">{l.action}</span>
                                        <span className="text-[10px] text-slate-500 block">{l.details}</span>
                                      </div>
                                      <span className="text-slate-400 font-bold">{new Date(l.created_at).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit Category Overlay Modal */}
                  {editingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <div className="relative w-full max-w-md bg-slate-950 border border-emerald-900/40 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-left">
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="absolute right-4 top-4 rounded-xl p-2 bg-slate-900 border border-emerald-900/20 text-slate-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-lg font-black text-white border-b border-emerald-950 pb-3 mb-6">
                          Edit Category: {editingCategory.name}
                        </h3>

                        <form onSubmit={handleEditCategorySubmit} className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Category Name *</label>
                            <input
                              type="text"
                              required
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Category Icon / Emoji *</label>
                            <input
                              type="text"
                              required
                              value={editingCategory.icon}
                              onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                              className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Category Image File (Optional)</label>
                            <div className="rounded-2xl border border-emerald-900/40 bg-slate-950 p-3.5">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditCategoryFileChange}
                                className="w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                              />
                              {editingCategory.image_url && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-900/30">
                                    ✓ Image file loaded (Base64 ready)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategory({ ...editingCategory, image_url: "" })}
                                    className="text-[10px] text-rose-400 hover:underline"
                                  >
                                    Remove Image
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              className="flex-1 rounded-2xl bg-slate-900 border border-emerald-900/20 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                            >
                              {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Edit Product Overlay Modal */}
                  {editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <div className="relative w-full max-w-lg bg-slate-950 border border-emerald-900/40 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-left">
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="absolute right-4 top-4 rounded-xl p-2 bg-slate-900 border border-emerald-900/20 text-slate-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-lg font-black text-white border-b border-emerald-950 pb-3 mb-6">
                          Edit Product: {editingProduct.name}
                        </h3>

                        <form onSubmit={handleEditProductSubmit} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Product Name *</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Brand Name *</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.brand}
                                onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Weight (e.g. 1 kg) *</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.weight}
                                onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Price (Rs.) *</label>
                              <input
                                type="number"
                                required
                                value={editingProduct.price}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Old Price (Rs.)</label>
                              <input
                                type="number"
                                value={editingProduct.old_price || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, old_price: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Discount (%)</label>
                              <input
                                type="number"
                                value={editingProduct.discount || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, discount: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Emoji *</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.emoji}
                                onChange={(e) => setEditingProduct({ ...editingProduct, emoji: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                              <select
                                required
                                value={editingProduct.category_id}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Wholesale Price (Rs.)</label>
                              <input
                                type="number"
                                value={editingProduct.wholesale_price || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, wholesale_price: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-300 block mb-1">Min Wholesale Qty</label>
                              <input
                                type="number"
                                value={editingProduct.wholesale_min_qty || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, wholesale_min_qty: e.target.value })}
                                className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 bg-slate-900/30 p-3 rounded-2xl border border-emerald-900/10">
                            <input
                              type="checkbox"
                              id="editStockCheck"
                              checked={editingProduct.stock}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.checked })}
                              className="h-4 w-4 rounded border-emerald-900 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer"
                            />
                            <label htmlFor="editStockCheck" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                              Product is In Stock
                            </label>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Product Image File (Optional)</label>
                            <div className="rounded-2xl border border-emerald-900/40 bg-slate-950 p-3.5">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditProductFileChange}
                                className="w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                              />
                              {editingProduct.image_url && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-900/30">
                                    ✓ Image file loaded (Base64 ready)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingProduct({ ...editingProduct, image_url: "" })}
                                    className="text-[10px] text-rose-400 hover:underline"
                                  >
                                    Remove Image
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(null)}
                              className="flex-1 rounded-2xl bg-slate-900 border border-emerald-900/20 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                            >
                              {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Edit Brand Overlay Modal */}
                  {editingBrand && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <div className="relative w-full max-w-md bg-slate-950 border border-emerald-900/40 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-left">
                        <button
                          onClick={() => setEditingBrand(null)}
                          className="absolute right-4 top-4 rounded-xl p-2 bg-slate-900 border border-emerald-900/20 text-slate-400 hover:text-white"
                          type="button"
                        >
                          <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-lg font-black text-white border-b border-emerald-950 pb-3 mb-6">
                          Edit Brand: {editingBrand.name}
                        </h3>

                        <form onSubmit={handleEditBrandSubmit} className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Brand Name *</label>
                            <input
                              type="text"
                              required
                              value={editingBrand.name}
                              onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                              className="w-full rounded-2xl border border-emerald-900/40 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">Brand Logo File (Optional)</label>
                            <div className="rounded-2xl border border-emerald-900/40 bg-slate-950 p-3.5">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditBrandFileChange}
                                className="w-full text-xs text-slate-300 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-950 file:text-emerald-400 cursor-pointer"
                              />
                              {editingBrand.image_url && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-900/30">
                                    ✓ Image file loaded (Base64 ready)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBrand({ ...editingBrand, image_url: "" })}
                                    className="text-[10px] text-rose-400 hover:underline"
                                  >
                                    Remove Logo
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingBrand(null)}
                              className="flex-1 rounded-2xl bg-slate-900 border border-emerald-900/20 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white hover:brightness-105 disabled:opacity-50 transition"
                            >
                              {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Stats Card Helper
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-3xl border border-emerald-950 bg-slate-900/20 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`rounded-2xl p-2.5 ${
          color === "emerald" ? "bg-emerald-950 text-emerald-400" :
          color === "teal" ? "bg-teal-950 text-teal-400" :
          color === "blue" ? "bg-blue-950 text-blue-400" : "bg-indigo-950 text-indigo-400"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-xl sm:text-2xl font-black text-white">{value}</div>
    </div>
  );
}
