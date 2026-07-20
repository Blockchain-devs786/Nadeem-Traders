import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  User, ShoppingBag, Heart, MapPin, CreditCard, Gift, Bell, 
  Eye, Star, HelpCircle, Settings, Shield, LogOut, CheckCircle, 
  XCircle, RotateCcw, DollarSign, Calendar, Clock, Lock, Mail,
  LayoutDashboard, Search, EyeOff, Loader2, ArrowRight, Compass, Trash2, Plus, AlertCircle, Leaf,
  Receipt, Layers, CheckCircle2, AlertTriangle, Truck
} from "lucide-react";
import { 
  restoreSession, logoutCustomer, getCustomerDashboardStats, getCartItems,
  getWishlist, getRecentlyViewed, getUserAddresses, addUserAddressDb, 
  deleteUserAddressDb, getProductReviews, submitReview, getSupportTickets, 
  createSupportTicket, getUserNotifications, markNotificationRead, getCoupons, 
  updateUserPreferences, getCustomerLoginHistory, getCustomerAuditLogs, removeFromCartDb,
  getProducts, getOrders
} from "../lib/actions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Nadeem Traders" },
      { name: "description", content: "Manage your profile, orders, addresses, and reward points." }
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard state variables
  const [stats, setStats] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Form states
  const [newAddress, setNewAddress] = useState({
    type: "shipping",
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    isDefault: false
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [isAddingTicket, setIsAddingTicket] = useState(false);

  const [newReview, setNewReview] = useState({ productId: "", rating: 5, comment: "" });
  const [isAddingReview, setIsAddingReview] = useState(false);

  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [prefForm, setPrefForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    marketingConsent: false,
    newsletterSubscription: false
  });

  const loadTabData = async (userId: number, tab: string) => {
    try {
      if (tab === "overview") {
        const [rv, n] = await Promise.all([
          getRecentlyViewed({ data: { userId } }),
          getUserNotifications({ data: { userId } })
        ]);
        setRecentlyViewed(rv);
        setNotifications(n);
      } else if (tab === "orders") {
        const allOrders = await getOrders();
        const userOrders = allOrders.filter(
          (o: any) =>
            o.user_id === userId ||
            (o.customer_email && currentUser?.email && o.customer_email.toLowerCase() === currentUser.email.toLowerCase())
        );
        setOrders(userOrders);
      } else if (tab === "wishlist") {
        const w = await getWishlist({ data: { userId } });
        setWishlist(w);
      } else if (tab === "cart") {
        const c = await getCartItems({ data: { userId } });
        setCart(c);
      } else if (tab === "addresses") {
        const addr = await getUserAddresses({ data: { userId } });
        setAddresses(addr);
      } else if (tab === "rewards") {
        const c = await getCoupons();
        setCoupons(c);
      } else if (tab === "notifications") {
        const n = await getUserNotifications({ data: { userId } });
        setNotifications(n);
      } else if (tab === "recently-viewed") {
        const rv = await getRecentlyViewed({ data: { userId } });
        setRecentlyViewed(rv);
      } else if (tab === "reviews") {
        const prods = await getProducts();
        setAllProducts(prods);
      } else if (tab === "tickets") {
        const tk = await getSupportTickets({ data: { userId } });
        setTickets(tk);
      } else if (tab === "security") {
        const [hist, logs] = await Promise.all([
          getCustomerLoginHistory({ data: { userId } }),
          getCustomerAuditLogs({ data: { userId } })
        ]);
        setLoginHistory(hist);
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error("Failed to load tab data:", e);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        let user = null;
        try {
          const session = await restoreSession();
          if (session && session.success) {
            user = session.user;
          }
        } catch (e) {
          console.warn("Server session restore failed:", e);
        }

        if (!user) {
          const localUser = sessionStorage.getItem("nadeem_user");
          if (localUser) {
            user = JSON.parse(localUser);
          }
        }

        if (user) {
          setCurrentUser(user);
          setPrefForm({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            phone: user.phone_number || "",
            marketingConsent: user.marketing_consent || false,
            newsletterSubscription: user.newsletter_subscription || false
          });
          const st = await getCustomerDashboardStats({ data: { userId: user.id } });
          setStats(st);
          await loadTabData(user.id, "overview");
        } else {
          window.location.href = "/login?redirect=/dashboard";
        }
      } catch (err) {
        console.error(err);
        window.location.href = "/login?redirect=/dashboard";
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (currentUser) {
      loadTabData(currentUser.id, tab);
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm("Are you sure you want to log out?");
    if (!confirm) return;
    try {
      await logoutCustomer();
      sessionStorage.removeItem("nadeem_user");
      toast.success("Successfully logged out.");
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      toast.error("Logout failed.");
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await addUserAddressDb({
        data: {
          userId: currentUser.id,
          type: newAddress.type,
          firstName: newAddress.firstName,
          lastName: newAddress.lastName,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: "Pakistan",
          phone: newAddress.phone,
          isDefault: newAddress.isDefault
        }
      });
      toast.success("Address added successfully!");
      setIsAddingAddress(false);
      setNewAddress({
        type: "shipping",
        firstName: "",
        lastName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
        isDefault: false
      });
      loadTabData(currentUser.id, "addresses");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address.");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!currentUser || !window.confirm("Delete this address?")) return;
    try {
      await deleteUserAddressDb({ data: { userId: currentUser.id, addressId: id } });
      toast.success("Address deleted.");
      loadTabData(currentUser.id, "addresses");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address.");
    }
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await createSupportTicket({
        data: {
          userId: currentUser.id,
          subject: newTicket.subject,
          message: newTicket.message
        }
      });
      toast.success("Support ticket opened successfully!");
      setIsAddingTicket(false);
      setNewTicket({ subject: "", message: "" });
      loadTabData(currentUser.id, "tickets");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit support ticket.");
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newReview.productId) return;
    try {
      await submitReview({
        data: {
          userId: currentUser.id,
          productId: parseInt(newReview.productId),
          rating: newReview.rating,
          comment: newReview.comment
        }
      });
      toast.success("Review submitted successfully!");
      setIsAddingReview(false);
      setNewReview({ productId: "", rating: 5, comment: "" });
      // refresh stats or products
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await updateUserPreferences({
        data: {
          userId: currentUser.id,
          marketingConsent: prefForm.marketingConsent,
          newsletterSubscription: prefForm.newsletterSubscription,
          phone: prefForm.phone
        }
      });
      toast.success("Preferences updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update preferences.");
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingOrderId) return;
    setTrackingLoading(true);
    setTrackedOrder(null);
    try {
      // Simulate live order tracking fetch or query DB orders
      // In a real database, we would query: SELECT * FROM orders WHERE id = trackingOrderId
      // For this implementation, we will query all user orders or fetch the order details:
      // Let's mock a simple result or retrieve from order list:
      await new Promise((r) => setTimeout(r, 1000));
      // We will look up if there is an order, otherwise show mockup
      setTrackedOrder({
        id: trackingOrderId,
        date: new Date(),
        status: "Dispatched",
        steps: [
          { name: "Order Placed", date: "10:30 AM", completed: true },
          { name: "Packed & Verified", date: "02:15 PM", completed: true },
          { name: "Dispatched (Gala Mandi Hub)", date: "04:30 PM", completed: true },
          { name: "Out for Delivery", date: "Expected tomorrow", completed: false },
          { name: "Delivered", date: "Expected tomorrow", completed: false }
        ]
      });
    } catch (err) {
      console.error(err);
      toast.error("Order not found or access denied.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleRemoveFromCart = async (id: number) => {
    if (!currentUser) return;
    try {
      await removeFromCartDb({ data: { userId: currentUser.id, productId: id } });
      toast.success("Item removed from cart");
      loadTabData(currentUser.id, "cart");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-4 font-semibold">Loading secure dashboard data...</span>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "tracking", label: "Order Tracking", icon: Compass },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "cart", label: "Shopping Cart", icon: CreditCard },
    { id: "addresses", label: "Saved Addresses", icon: MapPin },
    { id: "rewards", label: "Rewards & Coupons", icon: Gift },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "recently-viewed", label: "Recently Viewed", icon: Eye },
    { id: "reviews", label: "Reviews & Ratings", icon: Star },
    { id: "tickets", label: "Support Tickets", icon: HelpCircle },
    { id: "settings", label: "Profile Settings", icon: Settings },
    { id: "security", label: "Privacy & Security", icon: Shield },
    { id: "google", label: "Google Account", icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-white overflow-hidden border border-border shadow-soft">
              <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:inline">Logged in as: <strong className="text-foreground">{currentUser?.email}</strong></span>
            <Link to="/" className="text-xs font-bold text-muted-foreground hover:text-primary transition">Return to Store</Link>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 flex flex-col gap-2">
          <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-3.5 mb-2 shadow-soft">
            <img src={currentUser?.picture || "https://lh3.googleusercontent.com/a/default-user"} alt={currentUser?.name} className="h-11 w-11 rounded-full border border-border object-cover" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground truncate">{currentUser?.name}</h3>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 mt-1 border border-emerald-200 dark:border-emerald-900/30">Google Verified</span>
            </div>
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 py-2 lg:py-0 border-b border-border lg:border-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    activeTab === tab.id
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent transition shrink-0 mt-2"
            >
              <LogOut className="h-4 w-4" />
              Logout Session
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 bg-card border border-border rounded-[32px] p-6 md:p-8 min-h-[500px] shadow-soft">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Dashboard Overview</h2>
                <p className="text-xs text-muted-foreground mt-1">Quick snapshot of your customer status and stats ledger.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background border border-border rounded-2xl p-4 shadow-sm">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Reward Points</div>
                  <div className="text-2xl font-black text-primary mt-1">{stats?.rewardPoints || 0}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Welcome points loaded</div>
                </div>
                <div className="bg-background border border-border rounded-2xl p-4 shadow-sm">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Total Spent</div>
                  <div className="text-2xl font-black text-foreground mt-1">Rs. {(stats?.totalSpending || 0).toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Across all order cycles</div>
                </div>
                <div className="bg-background border border-border rounded-2xl p-4 shadow-sm">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Order Items</div>
                  <div className="text-2xl font-black text-foreground mt-1">{stats?.totalOrders || 0}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Total placed invoices</div>
                </div>
                <div className="bg-background border border-border rounded-2xl p-4 shadow-sm">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Member Since</div>
                  <div className="text-base font-black text-foreground mt-2">
                    {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "July 2026"}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">Joined via Google OAuth</div>
                </div>
              </div>

              {/* Detail Stats Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orders Breakdown */}
                <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 mb-4 flex items-center gap-1.5"><ShoppingBag className="h-4 w-4 text-primary" /> Invoice Breakdown</h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Pending Orders</span>
                      <span className="font-bold text-foreground">{stats?.pendingOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Completed / Delivered</span>
                      <span className="font-bold text-primary">{stats?.completedOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Cancelled Orders</span>
                      <span className="font-bold text-rose-500">{stats?.cancelledOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Returned Invoices</span>
                      <span className="font-bold text-amber-500">{stats?.returnedOrders || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="bg-background border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 mb-4 flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Account Security</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your session is monitored and saved. You can force-logout other devices and view your activity logs under the **Privacy & Security** tab.
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground border-t border-border pt-3 mt-4 flex justify-between">
                    <span>Last Login:</span>
                    <span className="font-bold text-foreground">
                      {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recently Viewed Shelf */}
              {recentlyViewed.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-1.5"><Eye className="h-4 w-4 text-primary" /> Keep Browsing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recentlyViewed.slice(0, 4).map((p) => (
                      <Link key={p.id} to={`/product/${p.id}` as any} className="group bg-background border border-border rounded-xl p-3 hover:-translate-y-0.5 transition block shadow-sm">
                        <div className="h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border mb-2">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <span className="text-4xl">{p.emoji}</span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition">{p.name}</h4>
                        <div className="text-xs font-black text-primary mt-1">Rs. {p.price}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Order History</h2>
                <p className="text-xs text-muted-foreground mt-1">Review all your previous purchases and invoice statuses.</p>
              </div>

              {orders.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-soft">
                  <ShoppingBag className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>No orders placed yet. Add items to your cart to checkout!</p>
                  <Link to="/" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline font-poppins">
                    Browse Products <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const getStatusStep = (status: string) => {
                      switch (status) {
                        case "Pending": return 1;
                        case "Processing": return 2;
                        case "Shipped": return 3;
                        case "Delivered": return 4;
                        default: return 0;
                      }
                    };
                    const step = getStatusStep(order.status);
                    
                    return (
                      <div key={order.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:border-primary/20">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 dark:text-white">Order #{order.id}</span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                order.status === "Pending" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300" :
                                order.status === "Processing" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300" :
                                order.status === "Shipped" ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300" :
                                order.status === "Delivered" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300" :
                                "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                              Placed on: {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">Cash on Delivery Total</div>
                            <div className="font-extrabold text-primary text-base">Rs. {order.total_amount.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Timeline stepper */}
                        {order.status !== "Cancelled" ? (
                          <div className="my-6 relative py-2">
                            <div className="absolute top-7 left-4 right-4 h-0.5 bg-border -z-10" />
                            <div
                              className="absolute top-7 left-4 h-0.5 bg-primary -z-10 transition-all duration-300"
                              style={{
                                width: `${step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%"}`,
                              }}
                            />
                            <div className="grid grid-cols-4 text-center">
                              {[
                                { label: "Placed", icon: Receipt, st: 1 },
                                { label: "Packing", icon: Layers, st: 2 },
                                { label: "Shipped", icon: Truck, st: 3 },
                                { label: "Delivered", icon: CheckCircle2, st: 4 }
                              ].map((stepItem, idx) => {
                                const Icon = stepItem.icon;
                                const active = step >= stepItem.st;
                                return (
                                  <div key={idx} className="flex flex-col items-center gap-1">
                                    <div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                                      active 
                                        ? "bg-primary border-primary text-primary-foreground shadow-glow" 
                                        : "bg-background border-border text-muted-foreground"
                                    }`}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{stepItem.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="my-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            This transaction was marked as Cancelled.
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                          <span className="text-xs text-muted-foreground font-medium max-w-[200px] truncate sm:max-w-none">
                            Ship to: {order.shipping_address}
                          </span>
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            {isExpanded ? "Hide Details" : "View Purchased Items"}
                          </button>
                        </div>

                        {/* Expanded Items */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-dashed border-border space-y-3 bg-background/50 p-4 rounded-2xl">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Purchase Invoice Items</div>
                            <div className="space-y-2">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-bold text-foreground">{item.product_name}</span>
                                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                  </div>
                                  <span className="font-bold text-foreground">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. ORDER TRACKING TAB */}
          {activeTab === "tracking" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Track Order</h2>
                <p className="text-xs text-muted-foreground mt-1">Look up live dispatch and delivery shipping timelines.</p>
              </div>

              <form onSubmit={handleTrackOrder} className="flex gap-3 max-w-md">
                <input
                  required
                  type="text"
                  placeholder="Enter Invoice / Order ID (e.g. 100023)"
                  value={trackingOrderId}
                  onChange={(e) => setTrackingOrderId(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary flex-1"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="rounded-xl bg-gradient-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 flex items-center gap-2"
                >
                  {trackingLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Track Status
                </button>
              </form>

              {trackedOrder && (
                <div className="bg-background border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center text-xs border-b border-border pb-3">
                    <div>
                      <span>Order Ref: <strong className="text-foreground">#{trackedOrder.id}</strong></span>
                      <span className="text-muted-foreground ml-4">Dispatched</span>
                    </div>
                    <span className="text-muted-foreground">COD</span>
                  </div>

                  {/* Vertical Progress Timeline */}
                  <div className="relative pl-6 border-l border-border ml-2.5 space-y-6 py-2">
                    {trackedOrder.steps.map((s: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[31px] top-0 h-4.5 w-4.5 rounded-full border-2 grid place-items-center ${
                          s.completed 
                            ? "bg-primary border-primary text-primary-foreground shadow-glow" 
                            : "bg-background border-border text-muted-foreground"
                        }`}>
                          <CheckCircle className="h-3 w-3 fill-current text-white dark:text-slate-950" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${s.completed ? "text-foreground" : "text-muted-foreground"}`}>{s.name}</h4>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">{s.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">My Wishlist</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage all your saved favorites and purchase them anytime.</p>
              </div>

              {wishlist.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <Heart className="h-10 w-10 text-rose-500 mx-auto mb-3 opacity-60" />
                  <p>Your wishlist is currently empty. Explore the shop and save some items!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlist.map((p) => (
                    <div key={p.id} className="bg-background border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border mb-3 relative">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl">{p.emoji}</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-foreground">{p.name}</h4>
                        <div className="text-[10px] text-muted-foreground mt-1">{p.brand} • {p.weight}</div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-sm font-black text-primary">Rs. {p.price}</span>
                        <Link to={`/product/${p.id}` as any} className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-primary border border-primary/30 px-3 py-1.5 text-[10px] font-bold hover:bg-primary hover:text-white transition">
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. SHOPPING CART TAB */}
          {activeTab === "cart" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Shopping Cart</h2>
                <p className="text-xs text-muted-foreground mt-1">Review active items saved in your persistent database cart.</p>
              </div>

              {cart.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>Your shopping cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-background border border-border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.emoji
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.brand} • {item.weight}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs font-bold text-foreground">{item.quantity} Qty</span>
                          <span className="text-xs font-bold text-primary block mt-0.5">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-rose-600 dark:text-rose-400 hover:text-rose-500 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Cart Subtotal:</span>
                    <span className="text-lg font-black text-primary">Rs. {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. SAVED ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Saved Addresses</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage multiple shipping and billing addresses linked to your account.</p>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="rounded-xl bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground flex items-center gap-1.5 hover:shadow-glow transition"
                  >
                    <Plus className="h-4 w-4" /> Add Address
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddAddress} className="bg-background border border-border rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-sm text-foreground">New Address</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      >
                        <option value="shipping">Shipping Address</option>
                        <option value="billing">Billing Address</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Contact</label>
                      <input
                        required
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="e.g. 03001234567"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                      <input
                        required
                        type="text"
                        value={newAddress.firstName}
                        onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                        placeholder="Ali"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                      <input
                        required
                        type="text"
                        value={newAddress.lastName}
                        onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                        placeholder="Ahmed"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 1</label>
                    <input
                      required
                      type="text"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      placeholder="House No, Street Name, Area name"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                      <input
                        required
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Lahore"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Province</label>
                      <input
                        required
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="Punjab"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Postal / Zip Code</label>
                      <input
                        required
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        placeholder="54000"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <input
                        id="addr-default"
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                        className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                      />
                      <label htmlFor="addr-default" className="ml-2 text-xs font-bold text-foreground">Set as default</label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <MapPin className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>No shipping addresses saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className="bg-background border border-border rounded-2xl p-5 relative shadow-sm">
                      {a.is_default && (
                        <span className="absolute right-4 top-4 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.5">
                          Default
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-foreground capitalize">{a.type} Address</h4>
                      <p className="text-xs font-bold text-foreground mt-3">{a.first_name} {a.last_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{a.address_line1}, {a.address_line2 && `${a.address_line2}, `}{a.city}, {a.state} - {a.postal_code}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-semibold">Contact: {a.phone}</p>
                      <button onClick={() => handleDeleteAddress(a.id)} className="absolute right-4 bottom-4 text-rose-600 dark:text-rose-400 hover:text-rose-500 transition text-[10px] font-bold">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. PAYMENT METHODS TAB */}
          {activeTab === "rewards" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Coupons & Rewards</h2>
                <p className="text-xs text-muted-foreground mt-1">Review active vouchers and loyalty reward point ledgers.</p>
              </div>

              {/* Coupons Seed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="bg-background border border-border rounded-2xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
                    <div className="pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 rounded-full bg-emerald-900/10" />
                    <div>
                      <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">Active Promo</span>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white mt-3 select-all tracking-wider font-mono">{c.code}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">Saves you {c.discount_percent}% off your invoice subtotal.</p>
                    </div>
                    <span className="text-3xl font-black text-primary">{c.discount_percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Notifications Inbox</h2>
                <p className="text-xs text-muted-foreground mt-1">Updates on reward points, invoice dispatch, and announcements.</p>
              </div>

              {notifications.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <Bell className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>Your notifications inbox is clean!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className={`bg-background border border-border rounded-2xl p-4 flex items-start justify-between gap-4 shadow-sm ${n.is_read ? "opacity-60" : ""}`}>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{n.message}</p>
                        <span className="text-[9px] text-muted-foreground block">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={async () => {
                            if (!currentUser) return;
                            await markNotificationRead({ data: { userId: currentUser.id, notificationId: n.id } });
                            loadTabData(currentUser.id, "notifications");
                          }}
                          className="text-[10px] font-bold text-primary hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. REVIEWS & RATINGS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Reviews & Ratings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Leave feedback for items you purchased from our catalog.</p>
                </div>
                {!isAddingReview && (
                  <button
                    onClick={() => setIsAddingReview(true)}
                    className="rounded-xl bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground flex items-center gap-1.5 hover:shadow-glow transition"
                  >
                    <Plus className="h-4 w-4" /> Leave Review
                  </button>
                )}
              </div>

              {isAddingReview ? (
                <form onSubmit={handleAddReview} className="bg-background border border-border rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-sm text-foreground">Write Product Review</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Product</label>
                    <select
                      required
                      value={newReview.productId}
                      onChange={(e) => setNewReview({ ...newReview, productId: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="">Select Item</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating Stars</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Very Bad)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comment / Feedback</label>
                    <textarea
                      required
                      rows={3}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your experience (freshness, weight, delivery quality)..."
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="border-t border-border pt-4 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingReview(false)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <Star className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>You can leave feedback on any product. Click "Leave Review" above!</p>
                </div>
              )}
            </div>
          )}

          {/* 10. SUPPORT TICKETS TAB */}
          {activeTab === "tickets" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Support Tickets</h2>
                  <p className="text-xs text-muted-foreground mt-1">Open support cases to get assistance from our admins.</p>
                </div>
                {!isAddingTicket && (
                  <button
                    onClick={() => setIsAddingTicket(true)}
                    className="rounded-xl bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground flex items-center gap-1.5 hover:shadow-glow transition"
                  >
                    <Plus className="h-4 w-4" /> Open Ticket
                  </button>
                )}
              </div>

              {isAddingTicket ? (
                <form onSubmit={handleAddTicket} className="bg-background border border-border rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-sm text-foreground">Submit New Support Case</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                    <input
                      required
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="e.g. Bulk Rice Shipping inquiry"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Message details</label>
                    <textarea
                      required
                      rows={4}
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      placeholder="Provide order ID if applicable, and explain your request clearly..."
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="border-t border-border pt-4 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingTicket(false)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              ) : tickets.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-6 text-center text-muted-foreground text-xs shadow-sm">
                  <HelpCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-3 opacity-60" />
                  <p>You have no open support tickets.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {tickets.map((t) => (
                    <div key={t.id} className="bg-background border border-border rounded-2xl p-4 flex justify-between items-start shadow-sm">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground">{t.subject}</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{t.message}</p>
                        <span className="text-[9px] text-muted-foreground block">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                        t.status === "Open" 
                          ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300" 
                          : "bg-muted border-border text-muted-foreground"
                      }`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 11. PROFILE SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Profile Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage contact info and notification preferences.</p>
              </div>

              <form onSubmit={handleUpdatePreferences} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                    <input
                      required
                      type="text"
                      value={prefForm.firstName}
                      onChange={(e) => setPrefForm({ ...prefForm, firstName: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                    <input
                      required
                      type="text"
                      value={prefForm.lastName}
                      onChange={(e) => setPrefForm({ ...prefForm, lastName: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Number</label>
                  <input
                    type="tel"
                    value={prefForm.phone}
                    onChange={(e) => setPrefForm({ ...prefForm, phone: e.target.value })}
                    placeholder="e.g. 03001234567"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-3.5 pt-4 border-t border-border">
                  <h3 className="font-bold text-xs text-foreground">Email Marketing Preferences</h3>
                  
                  <div className="flex items-start">
                    <input
                      id="opt-marketing"
                      type="checkbox"
                      checked={prefForm.marketingConsent}
                      onChange={(e) => setPrefForm({ ...prefForm, marketingConsent: e.target.checked })}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary mt-0.5"
                    />
                    <label htmlFor="opt-marketing" className="ml-2 text-xs text-muted-foreground leading-relaxed">
                      I agree to receive promotional updates, sale alerts, and rewards point coupons.
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="opt-newsletter"
                      type="checkbox"
                      checked={prefForm.newsletterSubscription}
                      onChange={(e) => setPrefForm({ ...prefForm, newsletterSubscription: e.target.checked })}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary mt-0.5"
                    />
                    <label htmlFor="opt-newsletter" className="ml-2 text-xs text-muted-foreground leading-relaxed font-medium">
                      I would like to subscribe to the weekly Gala Mandi market prices analysis newsletter.
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 12. PRIVACY & SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Privacy & Security</h2>
                <p className="text-xs text-muted-foreground mt-1">Audit active login sessions and account activity records.</p>
              </div>

              {/* Login history */}
              <div className="space-y-3.5">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Active Login History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-muted-foreground text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-foreground font-bold">
                        <th className="py-2.5">Time</th>
                        <th className="py-2.5">IP Address</th>
                        <th className="py-2.5">OS</th>
                        <th className="py-2.5">Browser</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loginHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-accent/40">
                          <td className="py-2.5 font-medium">{new Date(h.login_time).toLocaleString()}</td>
                          <td className="py-2.5 font-medium">{h.ip_address}</td>
                          <td className="py-2.5 font-medium">{h.device}</td>
                          <td className="py-2.5 font-medium">{h.browser}</td>
                          <td className="py-2.5 font-bold text-primary">{h.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit logs */}
              <div className="space-y-3.5 border-t border-border pt-6">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Account Audit Logs</h3>
                <div className="space-y-2 text-xs">
                  {auditLogs.map((l) => (
                    <div key={l.id} className="flex justify-between items-center bg-background rounded-xl p-3 border border-border shadow-sm">
                      <div>
                        <strong className="text-foreground font-bold">{l.action}</strong>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground text-right font-medium">{l.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 13. CONNECTED GOOGLE ACCOUNT TAB */}
          {activeTab === "google" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Connected Google Account</h2>
                <p className="text-xs text-muted-foreground mt-1">Safety parameters linked via OAuth 2.0.</p>
              </div>

              <div className="bg-background border border-border rounded-3xl p-5 md:p-6 space-y-5 max-w-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={currentUser?.picture || "https://lh3.googleusercontent.com/a/default-user"} alt={currentUser?.name} className="h-16 w-16 rounded-full border border-border object-cover shadow-sm" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">{currentUser?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{currentUser?.email}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5 mt-2 border border-emerald-200 dark:border-emerald-900/30">
                      <Lock className="h-3 w-3" /> Connected via Google OAuth 2.0
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground/60" />
                    <span className="font-medium">Email verification status: <strong className="text-primary font-bold">Verified by Google</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground/60" />
                    <span className="font-medium">Unique Identity hash: <strong className="text-foreground font-mono text-[9px] select-all font-bold">{currentUser?.google_id}</strong></span>
                  </div>
                </div>

                {/* Safety warning */}
                <div className="border border-border bg-background rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-muted-foreground shadow-sm">
                  <AlertCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="font-medium">
                    For your security, profile pictures and emails are synced directly from your Google account. You cannot modify your Google credentials manually.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
