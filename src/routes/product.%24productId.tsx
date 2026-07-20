import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Heart, Star, Plus, Minus, ShieldCheck, Truck, RefreshCw, Layers, Award, Loader2 } from "lucide-react";
import { getProducts } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";

export const Route = createFileRoute("/product/%24productId")({
  head: () => ({
    meta: [
      { title: "Product Details — Nadeem Traders" },
      { name: "description", content: "View prices, specifications, and wholesale mandi rates." }
    ],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams() as any;
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get user session
    if (typeof window !== "undefined") {
      const savedUser = sessionStorage.getItem("nadeem_user");
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
      }
    }

    const loadProductData = async () => {
      setLoading(true);
      try {
        const allProds = await getProducts();
        const found = allProds.find((p: any) => p.id === parseInt(productId));
        if (found) {
          setProduct(found);
          // Filter related products in same category
          const related = allProds
            .filter((p: any) => p.category_id === found.category_id && p.id !== found.id)
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      window.location.href = `/login?redirect=/product/${productId}`;
      return;
    }
    cartStore.addToCart(product, qty);
    toast.success(`Added ${qty} ${product.name} to basket!`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
        <Award className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          We couldn't locate this item. It may have been removed from the database by the admin.
        </p>
        <Link to="/" className="mt-6 px-6 py-2.5 bg-gradient-primary text-white font-bold rounded-2xl shadow-soft">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isWholesaleAvailable = !!product.wholesale_price;
  const isBulkRateApplied = isWholesaleAvailable && qty >= product.wholesale_min_qty;
  const activePrice = isBulkRateApplied ? product.wholesale_price : product.price;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 mt-8">
        <div className="grid gap-8 md:grid-cols-2 bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-soft">
          {/* Left Column: Product Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-mint rounded-2xl border border-slate-100 flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[12rem]">{product.emoji || "🌾"}</span>
            )}
            
            {product.discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-gradient-gold px-3.5 py-1 text-xs font-bold text-gold-foreground shadow-soft">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-primary tracking-wider uppercase bg-emerald-50 px-2.5 py-1 rounded">
                {product.category_name || "Groceries"}
              </span>

              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-800">{product.name}</h1>
              
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="font-bold text-muted-foreground">Brand: <span className="text-slate-800">{product.brand}</span></span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-muted-foreground">Weight: <span className="text-slate-800">{product.weight}</span></span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-3 text-xs">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 fill-gold text-gold`} />
                  ))}
                </div>
                <span className="font-bold">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} customer reviews)</span>
              </div>

              {/* Price Panel */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-muted-foreground">Standard Price</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl font-black text-primary">Rs. {product.price.toLocaleString()}</span>
                  {product.old_price && (
                    <span className="text-sm text-muted-foreground line-through">Rs. {product.old_price.toLocaleString()}</span>
                  )}
                </div>

                {isWholesaleAvailable && (
                  <div className="border-t border-slate-200/60 mt-3 pt-3">
                    <div className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> BULK MANDI RATE AVAILABLE
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Buy <strong className="text-slate-800">{product.wholesale_min_qty}</strong> or more units to get the wholesale rate of <strong className="text-primary">Rs. {product.wholesale_price?.toLocaleString()}/unit</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-6 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${product.stock ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {product.stock ? "In Stock (Available)" : "Out of Stock (Currently Unavailable)"}
                </span>
              </div>
            </div>

            {/* Shopping Action */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              {product.stock && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Quantity</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-slate-100 text-slate-500 transition"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-5 py-2 text-sm font-bold text-slate-800">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="px-3 py-2 hover:bg-slate-100 text-slate-500 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {isBulkRateApplied && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-xl uppercase animate-pulse">
                      Bulk Price Active!
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.stock}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow disabled:opacity-50 transition"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.stock ? `Add to Cart (Rs. ${(activePrice * qty).toLocaleString()})` : "Out of Stock"}
                </button>
                <button className="rounded-2xl border border-slate-200 p-3.5 hover:bg-slate-50 transition">
                  <Heart className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <BenefitCard icon={Truck} title="Fast Delivery" desc="Same day dispatch across major cities." />
          <BenefitCard icon={ShieldCheck} title="100% Genuine" desc="Direct commission-agent sourcing." />
          <BenefitCard icon={RefreshCw} title="Easy Returns" desc="Exchange policy at your doorstep." />
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-lg font-black text-slate-800 mb-6">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/product/${rp.id}` as any}
                  className="group rounded-2xl border border-slate-200 bg-white p-3 hover:shadow-soft transition"
                >
                  <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center text-4xl">
                    {rp.image_url ? (
                      <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover" />
                    ) : (
                      rp.emoji
                    )}
                  </div>
                  <h4 className="font-bold text-xs mt-3 truncate group-hover:text-primary transition">{rp.name}</h4>
                  <div className="font-extrabold text-xs text-primary mt-1">Rs. {rp.price.toLocaleString()}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-3 bg-white border border-slate-200 p-4 rounded-2xl items-center">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
