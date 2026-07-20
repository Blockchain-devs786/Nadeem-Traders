import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Search, Plus, Loader2, ArrowRight } from "lucide-react";
import { getProducts } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";

export const Route = createFileRoute("/gala-mandi")({
  head: () => ({
    meta: [
      { title: "Gala Mandi Wholesale — Nadeem Traders" },
      { name: "description", content: "Buy bulk spices, flour, rice, and pulses at wholesale mandi prices." }
    ],
  }),
  component: GalaMandiPage,
});

function GalaMandiPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/shop?tab=wholesale");
    }
  }, []);

  const handleAddToCart = async (product: any) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      window.location.href = "/login?redirect=/gala-mandi";
      return;
    }
    cartStore.addToCart(product, product.wholesale_min_qty || 5, true);
    toast.success(`Added bulk ${product.name} to cart!`);
  };

  const filtered = products.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-slate-400 mt-4">Loading wholesale catalog...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-emerald-950/40 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-white overflow-hidden">
              <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition">Return to Store</Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white">Gala Mandi Wholesale Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Get real-time wholesale mandi bulk rates on commercial spices, rice, atta, and pulses.</p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bulk products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-emerald-900/30 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
          />
        </div>

        {/* Catalog grid */}
        {filtered.length === 0 ? (
          <div className="bg-slate-900/20 border border-emerald-900/10 rounded-[32px] py-16 text-center text-slate-400 text-xs">
            <p className="font-semibold text-slate-200">No bulk products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, 5).map((w) => {
                const save = Math.round(((w.price - w.wholesale_price) / w.price) * 100);
                return (
                  <div key={w.id} className="group relative overflow-hidden rounded-3xl border border-emerald-950/40 bg-slate-900/30 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant flex items-center justify-between gap-4">
                    {w.image_url ? (
                      <>
                        <img src={w.image_url} alt={w.name} className="absolute inset-0 w-full h-full object-cover opacity-20 transition duration-500 group-hover:scale-105" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-mint flex items-center justify-center opacity-[0.04]">
                        <span className="text-7xl">{w.emoji}</span>
                      </div>
                    )}
                    <div className="relative min-w-0 flex-1 z-10 text-white">
                      <div className="flex items-center gap-2">
                        <Link to={`/product/${w.id}` as any} className="hover:text-emerald-400 transition truncate">
                          <h3 className="truncate font-bold text-base text-white">{w.name}</h3>
                        </Link>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Save {save}%</span>
                      </div>
                      <div className="mt-3 flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-3 text-xs">
                          <span className="text-slate-400 line-through">Rs. {w.price}/kg</span>
                          <span className="text-lg font-extrabold text-emerald-400">Rs. {w.wholesale_price}/kg</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-bold mt-1">
                          Bulk rate applies at min {w.wholesale_min_qty} qty
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(w)}
                      className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground transition hover:shadow-glow z-10"
                      aria-label="Bulk order"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {filtered.length > 5 && (
              <div className="mt-8 flex justify-center">
                <Link
                  to="/bulk-orders"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition duration-200"
                >
                  Explore More Bulk Orders <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
