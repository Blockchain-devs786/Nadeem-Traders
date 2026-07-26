import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User, Mail, Calendar, Receipt, ShoppingBag, Truck,
  CheckCircle2, AlertTriangle, ArrowLeft, LogOut, Loader2,
  TrendingUp, Layers
} from "lucide-react";
import { getOrders } from "../lib/actions";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile Dashboard — Nadeem Traders" },
      { name: "description", content: "View your order history, delivery timelines, and account details." }
    ],
  }),
  component: ProfileDashboardPage,
});

function ProfileDashboardPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const fetchUserOrders = async (email: string) => {
    try {
      const allOrders = await getOrders();
      // filter orders for this user by email
      const userOrders = allOrders.filter((o: any) => o.customer_email.toLowerCase() === email.toLowerCase());
      setOrders(userOrders);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your orders history.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("nadeem_user");
      const lastVerified = localStorage.getItem("nadeem_last_verified_at");
      
      if (savedUser && lastVerified) {
        const days = (Date.now() - Number(lastVerified)) / (1000 * 60 * 60 * 24);
        if (days > 7) {
          localStorage.removeItem("nadeem_user");
          localStorage.removeItem("nadeem_last_verified_at");
          toast.info("Your session has expired. Please verify your email again.");
          navigate({ to: "/", search: { login: "true" } as any });
        } else {
          try {
            const userObj = JSON.parse(savedUser);
            setCurrentUser(userObj);
            fetchUserOrders(userObj.email);
          } catch (e) {
            navigate({ to: "/", search: { login: "true" } as any });
          }
        }
      } else {
        navigate({ to: "/", search: { login: "true" } as any });
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setOrders([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nadeem_user");
      localStorage.removeItem("nadeem_last_verified_at");
    }
    toast.info("Signed out successfully");
    router.invalidate();
  };

  // Calculate statistics
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const totalSpend = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Status timeline helper
  const getStatusStep = (status: string) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Processing":
        return 2;
      case "Shipped":
        return 3;
      case "Delivered":
        return 4;
      default:
        return 0; // Cancelled
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-sm font-semibold">Redirecting to Sign In...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Small Header */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-bold text-slate-600 hover:text-primary transition flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Shop
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3.5 py-1.5 text-xs font-bold hover:bg-rose-100 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 mt-8">
        {/* Customer Header card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-primary font-black text-white text-3xl shadow-glow uppercase shrink-0">
            {currentUser.name[0]}
          </div>
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-800">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="h-4 w-4 text-primary" /> {currentUser.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Calendar className="h-4 w-4 text-primary" /> Joined on {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Account statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <StatCard title="Active Orders" value={activeOrders} icon={Truck} color="teal" />
          <StatCard title="Delivered Orders" value={deliveredOrders} icon={CheckCircle2} color="emerald" />
          <StatCard title="Total Spent" value={`Rs. ${totalSpend.toLocaleString()}`} icon={TrendingUp} color="gold" />
        </section>

        {/* Order History */}
        <div className="mt-10">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
            <ShoppingBag className="h-5 w-5 text-primary" /> Order Timeline & History
          </h2>

          {loading ? (
            <div className="flex h-48 items-center justify-center bg-white border border-slate-200 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-muted-foreground">
              No orders found. Buy some wholesale products to start your timeline!
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const step = getStatusStep(order.status);
                
                return (
                  <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:border-primary/20">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">Order #{order.id}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            order.status === "Pending" ? "bg-amber-100 text-amber-800" :
                            order.status === "Processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "Shipped" ? "bg-indigo-100 text-indigo-800" :
                            order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Placed on: {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Cash on Delivery Total</div>
                        <div className="font-extrabold text-primary text-base">Rs. {order.total_amount.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    {order.status !== "Cancelled" ? (
                      <div className="my-6 relative py-2">
                        <div className="absolute top-7 left-4 right-4 h-0.5 bg-slate-200 -z-10" />
                        <div
                          className="absolute top-7 left-4 h-0.5 bg-primary -z-10 transition-all duration-300"
                          style={{
                            width: `${step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%"}`,
                          }}
                        />
                        <div className="grid grid-cols-4 text-center">
                          <TimelineStep active={step >= 1} label="Placed" icon={Receipt} />
                          <TimelineStep active={step >= 2} label="Packing" icon={Layers} />
                          <TimelineStep active={step >= 3} label="Shipped" icon={Truck} />
                          <TimelineStep active={step >= 4} label="Delivered" icon={CheckCircle2} />
                        </div>
                      </div>
                    ) : (
                      <div className="my-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        This transaction was marked as Cancelled by Nadeem Traders admin.
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                      <span className="text-xs text-slate-400 font-bold max-w-[200px] truncate sm:max-w-none">
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
                      <div className="mt-4 pt-4 border-t border-dashed border-slate-100 space-y-3 bg-slate-50/50 p-4 rounded-2xl">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Invoice Items</div>
                        <div className="space-y-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-extrabold text-slate-800">{item.product_name}</span>
                                <span className="text-slate-400 ml-1">x{item.quantity}</span>
                              </div>
                              <span className="font-bold text-slate-700">Rs. {(item.price * item.quantity).toLocaleString()}</span>
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
      </main>
    </div>
  );
}

// Helpers
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft flex items-center justify-between">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className="mt-2 text-2xl font-black text-slate-800">{value}</div>
      </div>
      <div className={`rounded-2xl p-3 ${
        color === "teal" ? "bg-teal-50 text-teal-600" :
        color === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function TimelineStep({ active, label, icon: Icon }: { active: boolean; label: string; icon: any }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${
        active
          ? "border-primary bg-primary text-white shadow-soft"
          : "border-slate-300 bg-white text-slate-400"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className={`mt-1.5 text-[10px] font-bold ${active ? "text-primary font-extrabold" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}
