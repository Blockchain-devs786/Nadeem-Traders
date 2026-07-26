import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { 
  ChevronRight, ArrowLeft, Filter, SlidersHorizontal, ArrowUpDown, 
  Leaf, Loader2, Sparkles, AlertCircle, Eye, ShoppingBag, Plus, X, Star
} from "lucide-react";
import { getProducts, getCategories } from "../lib/actions";
import { toast } from "sonner";
import { cartStore } from "../lib/cart-store";

export const Route = createFileRoute("/category/%24categoryId")({
  head: () => ({
    meta: [
      { title: "Category Listings — Nadeem Traders" },
      { name: "description", content: "Explore fresh spices, grains, rice, and grocery items." }
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams() as any;

  const [category, setCategory] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter and Sorting state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState("featured");

  // Mobile Filter Drawer
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(8);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Get user session
    if (typeof window !== "undefined") {
      const savedUser = sessionStorage.getItem("nadeem_user");
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
      }
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts()
        ]);
        setAllCategories(cats);
        
        const cat = cats.find((c: any) => c.id === parseInt(categoryId));
        if (cat) {
          setCategory(cat);
          const filtered = prods.filter((p: any) => p.category_id === cat.id);
          setProducts(filtered);
        }
      } catch (err) {
        console.error("Failed to load category products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryId]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleAddToCart = async (product: any) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      // Redirect to login
      window.location.href = `/login?redirect=/category/${categoryId}`;
      return;
    }
    cartStore.addToCart(product, 1);
    toast.success(`Added ${product.name} to cart!`);
  };

  // 1. Filtering logic
  const filteredProducts = products.filter(p => {
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
    const matchesPrice = p.price <= priceRange;
    const matchesStock = !inStockOnly || p.stock;
    const matchesRating = p.rating >= minRating;
    return matchesBrand && matchesPrice && matchesStock && matchesRating;
  });

  // 2. Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "newest") return b.id - a.id;
    if (sortBy === "title-az") return a.name.localeCompare(b.name);
    if (sortBy === "title-za") return b.name.localeCompare(a.name);
    return 0; // featured/default ID sorting
  });

  // 3. Paginated slice
  const paginatedProducts = sortedProducts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + pageSize);
      setLoadingMore(false);
    }, 600);
  };

  const brandsList = Array.from(new Set(products.map(p => p.brand)));
  const categoryDescription = category ? `Premium quality fresh ${category.name.toLowerCase()} sourced directly from verified agricultural producers across Punjab & Sindh. Hand-sorted and packed with hygienic standards.` : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-slate-400 mt-4 font-semibold">Loading category catalog...</span>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Category Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">This category does not exist in our catalog database.</p>
        <Link to="/" className="mt-6 px-6 py-2.5 bg-gradient-primary text-white font-bold rounded-xl shadow-soft">
          Return to Shop
        </Link>
      </div>
    );
  }

  const relatedCategories = allCategories.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-emerald-950/15 blur-[150px]" />

      {/* Header */}
      <header className="border-b border-emerald-950/40 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">Nadeem<span className="text-primary">Traders</span></span>
          </Link>
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition">Return to Shop</Link>
        </div>
      </header>

      {/* Hero Category Banner */}
      <section className="bg-gradient-to-b from-slate-900/80 to-slate-950 border-b border-emerald-950/20 py-10 relative">
        <div className="mx-auto max-w-7xl px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
            <Link to="/" className="hover:text-slate-300">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-emerald-400">{category.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3.5">
                <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-2xl border border-emerald-900/30 shadow-soft">{category.icon}</span>
                {category.name} Catalog
              </h1>
              <p className="mt-2.5 max-w-2xl text-xs text-slate-400 leading-relaxed">{categoryDescription}</p>
            </div>
            <div className="bg-slate-900/50 border border-emerald-900/10 rounded-2xl px-5 py-3.5 shrink-0">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Products</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{filteredProducts.length} items</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Workspace */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-emerald-900/20 rounded-3xl p-5 space-y-6">
            <div className="flex justify-between items-center border-b border-emerald-950/40 pb-2.5">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5"><Filter className="h-4 w-4 text-primary" /> Filter Options</h3>
              {(selectedBrands.length > 0 || priceRange < 5000 || inStockOnly || minRating > 0) && (
                <button
                  onClick={() => {
                    setSelectedBrands([]);
                    setPriceRange(5000);
                    setInStockOnly(false);
                    setMinRating(0);
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                <span>Max Price Range</span>
                <span className="text-emerald-400">Rs. {priceRange}</span>
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Brands Checkboxes */}
            {brandsList.length > 0 && (
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Filter Brand</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {brandsList.map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        id={`brand-${brand}`}
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="h-4 w-4 rounded border-emerald-900 bg-slate-950 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`brand-${brand}`} className="ml-2 text-xs text-slate-300 font-semibold">{brand}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Filter */}
            <div className="space-y-3.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rating Threshold</label>
              <div className="flex flex-col gap-2.5">
                {[4.5, 4.0, 3.5, 0].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                      minRating === rating 
                        ? "bg-emerald-950/40 border-primary text-emerald-400" 
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${rating > 0 ? "fill-gold text-gold" : "text-slate-500"}`} />
                    {rating === 0 ? "All Ratings" : `${rating} & above`}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center pt-2.5 border-t border-emerald-950/40">
              <input
                id="stock-only"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-emerald-900 bg-slate-950 text-primary focus:ring-primary"
              />
              <label htmlFor="stock-only" className="ml-2 text-xs font-bold text-slate-300">In Stock only</label>
            </div>
          </div>

          {/* Related Categories Sidebar Panel */}
          {relatedCategories.length > 0 && (
            <div className="bg-slate-900/20 border border-emerald-900/10 rounded-3xl p-5 space-y-4">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Related Categories</h3>
              <div className="flex flex-col gap-2">
                {relatedCategories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.id}` as any}
                    className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition py-1"
                  >
                    <span>{c.icon} {c.name}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column Catalog Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sorting / Mobile Filter Trigger Header */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/20 border border-emerald-900/10 rounded-2xl px-5 py-3 text-slate-200">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 rounded-xl border border-emerald-900/30 px-3.5 py-2 text-xs font-bold hover:bg-slate-900 transition"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-400" /> Filters
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">Showing <strong>{paginatedProducts.length}</strong> of <strong>{sortedProducts.length}</strong> products</span>

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-emerald-900/20 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating: Highest Rated</option>
                <option value="newest">Date: Newest</option>
                <option value="title-az">Name: A to Z</option>
                <option value="title-za">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {paginatedProducts.length === 0 ? (
            <div className="bg-slate-900/20 border border-emerald-900/10 rounded-[32px] py-16 px-4 text-center text-slate-400 text-xs">
              <ShoppingBag className="h-12 w-12 text-emerald-900 mx-auto mb-3" />
              <p className="font-semibold text-slate-300">No matching products found</p>
              <p className="mt-1">Try clearing some filters to expand your product discovery search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {paginatedProducts.map((p) => {
                const save = p.old_price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;
                return (
                  <div key={p.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-emerald-950/40 bg-slate-900/20 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-elegant h-[350px]">
                    <Link to={`/product/${p.id}` as any} className="absolute inset-0 w-full h-full">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-103" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#d1fae5]/35 to-[#d1fae5]/10 flex items-center justify-center">
                          <span className="text-7xl drop-shadow-md select-none">{p.emoji || "🌾"}</span>
                        </div>
                      )}
                    </Link>

                    {/* Top Badges */}
                    <div className="relative p-3.5 flex justify-between items-start z-10 pointer-events-none">
                      {save > 0 ? (
                        <span className="rounded-full bg-gradient-gold px-2.5 py-0.5 text-[10px] font-bold text-gold-foreground shadow-soft pointer-events-auto">-{save}%</span>
                      ) : <div />}
                      
                      {!p.stock && (
                        <span className="rounded bg-rose-950 border border-rose-900 px-2 py-0.5 text-[9px] font-bold text-rose-400">Out of Stock</span>
                      )}
                    </div>

                    {/* Info Shelf */}
                    <div className="mt-auto relative z-10 p-4 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent text-white">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span className="text-emerald-400">{p.brand}</span>
                        <span>{p.weight}</span>
                      </div>
                      
                      <Link to={`/product/${p.id}` as any} className="hover:text-emerald-400 transition mt-1.5 block">
                        <h3 className="line-clamp-2 text-xs md:text-sm font-bold leading-snug text-slate-100">{p.name}</h3>
                      </Link>

                      <div className="flex items-center gap-1 text-[10px] mt-1.5 text-slate-300">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        <span className="font-bold text-white">{p.rating}</span>
                        <span>({p.reviews})</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-emerald-950/40">
                        <div>
                          <div className="text-sm md:text-base font-black text-emerald-400">Rs. {p.price}</div>
                          {p.old_price && <div className="text-[10px] text-slate-400 line-through">Rs. {p.old_price}</div>}
                        </div>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={!p.stock}
                          className="grid h-8.5 w-8.5 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 pointer-events-auto transition"
                          aria-label="Add to cart"
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

          {/* Load More Pagination */}
          {sortedProducts.length > paginatedProducts.length && (
            <div className="pt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-emerald-900/30 px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                Load More Products
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="relative w-full max-w-xs bg-slate-900 border-l border-emerald-900/20 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-950/40 pb-3">
                <h3 className="font-bold text-sm text-slate-200">Catalog Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Max Price Range</span>
                  <span className="text-emerald-400">Rs. {priceRange}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Brands Checkboxes */}
              {brandsList.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Filter Brand</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                    {brandsList.map((brand) => (
                      <div key={brand} className="flex items-center">
                        <input
                          id={`mob-brand-${brand}`}
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="h-4 w-4 rounded border-emerald-900 bg-slate-950 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`mob-brand-${brand}`} className="ml-2 text-xs text-slate-300 font-semibold">{brand}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rating Threshold</label>
                <div className="flex flex-col gap-2">
                  {[4.5, 4.0, 3.5, 0].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        minRating === rating 
                          ? "bg-emerald-950/40 border-primary text-emerald-400" 
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${rating > 0 ? "fill-gold text-gold" : "text-slate-500"}`} />
                      {rating === 0 ? "All Ratings" : `${rating} & above`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center pt-2.5 border-t border-emerald-950/40">
                <input
                  id="mob-stock-only"
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-emerald-900 bg-slate-950 text-primary"
                />
                <label htmlFor="mob-stock-only" className="ml-2 text-xs font-bold text-slate-300">In Stock only</label>
              </div>
            </div>

            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-xl bg-gradient-primary py-2.5 text-xs font-bold text-primary-foreground text-center"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
