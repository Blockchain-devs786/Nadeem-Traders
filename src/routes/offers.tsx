import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Star, Plus, Loader2, Sparkles } from "lucide-react";
import { getProducts } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Special Offers & Hot Deals — Nadeem Traders" },
      { name: "description", content: "Check out active discounts on atta, spices, rice, and cooking oil." }
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/shop?tab=offers");
    }
  }, []);

  const handleAddToCart = async (product: any) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      window.location.href = `/login?redirect=/offers`;
      return;
    }
    cartStore.addToCart(product, 1);
    toast.success(`Added ${product.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-slate-400 mt-4">Loading discount offers...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-emerald-950/40 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition">Return to Store</Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" /> Hot Deals & Discounts
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Save up to 40% on monthly karyana groceries. Shop authentic, fresh stocks at lower rates.</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-slate-900/20 border border-emerald-900/10 rounded-[32px] py-16 text-center text-slate-400 text-xs">
            <p>No special discounts active today. Keep checking our catalog weekly!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {products.map((p) => {
              const save = p.old_price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : p.discount;
              return (
                <div key={p.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-emerald-950/40 bg-slate-900/20 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-elegant h-[340px]">
                  <Link to={`/product/${p.id}` as any} className="absolute inset-0 w-full h-full">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-103" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#d1fae5]/35 to-[#d1fae5]/10 flex items-center justify-center">
                        <span className="text-7xl drop-shadow-md select-none">{p.emoji || "🌾"}</span>
                      </div>
                    )}
                  </Link>

                  <div className="relative p-3.5 flex justify-between items-start z-10 pointer-events-none">
                    {save > 0 ? (
                      <span className="rounded-full bg-gradient-gold px-2.5 py-0.5 text-[10px] font-bold text-gold-foreground shadow-soft pointer-events-auto">-{save}% OFF</span>
                    ) : <div />}
                  </div>

                  <div className="mt-auto relative z-10 p-4 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent text-white">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span className="text-emerald-400">{p.brand}</span>
                      <span>{p.weight}</span>
                    </div>
                    <Link to={`/product/${p.id}` as any} className="hover:text-emerald-400 transition mt-1.5 block">
                      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-100">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 text-[10px] mt-1.5 text-slate-300">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <span className="font-bold text-white">{p.rating}</span>
                      <span>({p.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-emerald-950/40">
                      <div>
                        <div className="text-sm font-black text-emerald-400">Rs. {p.price}</div>
                        {p.old_price && <div className="text-[10px] text-slate-400 line-through">Rs. {p.old_price}</div>}
                      </div>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow pointer-events-auto transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
