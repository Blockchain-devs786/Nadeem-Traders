import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Leaf, Search, Star, Plus, Minus, Loader2, X, Filter, ChevronDown, 
  Sparkles, Award, Layers, Check, ShoppingBag, Eye, ShoppingCart, 
  Wallet, ArrowRight 
} from "lucide-react";
import { 
  getProducts, getCategories, getBrands, addToCartDb, getCartItems,
  updateCartItemQuantityDb, removeFromCartDb, createOrder, restoreSession,
  getUserAddresses, clearCartDb
} from "../lib/actions";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Unified Product Catalog — Nadeem Traders" },
      { name: "description", content: "Explore our full range of retail groceries, wholesale mandi essentials, brands, and hot deals." }
    ],
  }),
  component: ShopPage,
});

interface CartItem {
  id: number;
  name: string;
  brand: string;
  weight: string;
  price: number;
  wholesale_price?: number | null;
  wholesale_min_qty: number;
  emoji: string;
  quantity: number;
  image_url?: string | null;
}

function ShopPage() {
  const [products, setProducts] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("hb_products_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("hb_categories_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [brands, setBrands] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("hb_brands_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem("hb_products_cache");
      const c = localStorage.getItem("hb_categories_cache");
      const b = localStorage.getItem("hb_brands_cache");
      return !(p && c && b);
    }
    return true;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("nadeem_user");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  // Cart and Checkout States
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("hb_cart_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "", phone: "", address: "" });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all"); // "all", "retail", "wholesale", "offers"
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("default"); // "default", "price-asc", "price-desc", "rating", "discount"
  const [inStockOnly, setInStockOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  
  // Mobile UI States
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load cart items helper
  const loadCart = async () => {
    try {
      const items = await getCartItems({ data: {} });
      setCart(items.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        weight: item.weight,
        price: item.price,
        wholesale_price: item.wholesale_price,
        wholesale_min_qty: item.wholesale_min_qty || 1,
        emoji: item.emoji || "🌾",
        quantity: item.quantity,
        image_url: item.image_url
      })));
    } catch (e) {
      console.error("Failed to load cart items:", e);
    }
  };

  // Initialize and Load Data
  useEffect(() => {
    const initializeSession = async () => {
      const hasCache = typeof window !== "undefined" && 
        localStorage.getItem("hb_products_cache") && 
        localStorage.getItem("hb_categories_cache") && 
        localStorage.getItem("hb_brands_cache");
      if (!hasCache) {
        setLoading(true);
      }
      try {
        const [cats, prods, brs, session] = await Promise.all([
          getCategories(),
          getProducts(),
          getBrands(),
          restoreSession().catch(() => null)
        ]);
        
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("hb_categories_cache", JSON.stringify(cats));
            localStorage.setItem("hb_products_cache", JSON.stringify(prods));
            localStorage.setItem("hb_brands_cache", JSON.stringify(brs));
          } catch (e) {}
        }

        setCategories(cats);
        setProducts(prods);
        setBrands(brs);
        setLoading(false);

        // Process user session
        let user = null;
        if (session && session.success) {
          user = session.user;
        } else {
          const localUser = sessionStorage.getItem("nadeem_user");
          if (localUser) user = JSON.parse(localUser);
        }

        if (user) {
          setCurrentUser(user);
          sessionStorage.setItem("nadeem_user", JSON.stringify(user));
          setCheckoutForm(prev => ({
            ...prev,
            name: user.name,
            email: user.email
          }));

          // Fetch user-specific details (addresses, cart) concurrently
          const [addrs, items] = await Promise.all([
            getUserAddresses({ data: { userId: user.id } }).catch(() => []),
            getCartItems({ data: {} }).catch(() => [])
          ]);

          const def = addrs.find(a => a.is_default) || addrs[0];
          if (def) {
            const fullAddr = `${def.address_line1}, ${def.address_line2 ? def.address_line2 + ', ' : ''}${def.city}, ${def.state} - ${def.postal_code}`;
            setCheckoutForm(prev => ({ ...prev, address: fullAddr }));
          }

          const mappedCart = items.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            weight: item.weight,
            price: item.price,
            wholesale_price: item.wholesale_price,
            wholesale_min_qty: item.wholesale_min_qty || 1,
            emoji: item.emoji || "🌾",
            quantity: item.quantity,
            image_url: item.image_url
          }));
          setCart(mappedCart);
          try {
            localStorage.setItem("hb_cart_cache", JSON.stringify(mappedCart));
          } catch (e) {}
        } else {
          // Fetch guest cart
          const items = await getCartItems({ data: {} }).catch(() => []);
          const mappedCart = items.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            weight: item.weight,
            price: item.price,
            wholesale_price: item.wholesale_price,
            wholesale_min_qty: item.wholesale_min_qty || 1,
            emoji: item.emoji || "🌾",
            quantity: item.quantity,
            image_url: item.image_url
          }));
          setCart(mappedCart);
          try {
            localStorage.setItem("hb_cart_cache", JSON.stringify(mappedCart));
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }

      // Check URL parameters
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        const brandParam = params.get("brand");
        
        if (tabParam) {
          if (["retail", "wholesale", "offers", "brands"].includes(tabParam)) {
            if (tabParam === "brands") {
              setSelectedChannel("all");
            } else {
              setSelectedChannel(tabParam);
            }
          }
        }
        if (brandParam) {
          setSelectedBrands([brandParam]);
        }

        if (params.get("checkout") === "true") {
          setTimeout(() => {
            setIsCheckoutOpen(true);
          }, 500);
        }
      }
    };

    initializeSession();
  }, []);

  // Pricing calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    let savings = 0;

    cart.forEach((item) => {
      const retailCost = item.price * item.quantity;
      const actualPrice =
        item.wholesale_price && item.quantity >= item.wholesale_min_qty
          ? item.wholesale_price
          : item.price;
      const actualCost = actualPrice * item.quantity;

      subtotal += actualCost;
      savings += retailCost - actualCost;
    });

    return { subtotal, savings };
  };

  const { subtotal, savings } = calculateCartTotals();

  // Cart operations helpers
  const syncCartState = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("hb_cart_cache", JSON.stringify(newCart));
    } catch (e) {
      console.warn("Failed to cache cart to localStorage:", e);
    }
  };

  const fetchLatestCartFromServer = async () => {
    try {
      const items = await getCartItems({ data: { userId: currentUser?.id } });
      const mapped = items.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        weight: item.weight,
        price: item.price,
        wholesale_price: item.wholesale_price,
        wholesale_min_qty: item.wholesale_min_qty || 1,
        emoji: item.emoji || "🌾",
        quantity: item.quantity,
        image_url: item.image_url
      }));
      syncCartState(mapped);
    } catch (e) {
      console.error("Failed to sync cart from server:", e);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!currentUser) {
      toast.error("Please sign in with Google to start shopping!");
      window.location.href = `/login?redirect=/shop?tab=${selectedChannel}`;
      return;
    }

    // Determine quantity: if product has a wholesale price and wholesale channel is active
    const isWholesaleActive = selectedChannel === "wholesale" || (!selectedChannel && product.wholesale_price);
    const qty = isWholesaleActive ? (product.wholesale_min_qty || 5) : 1;

    // 1. Optimistic Update
    const existingIndex = cart.findIndex(i => i.id === product.id);
    let optimisticCart: CartItem[];
    if (existingIndex > -1) {
      optimisticCart = cart.map((item, idx) => 
        idx === existingIndex ? { ...item, quantity: item.quantity + qty } : item
      );
    } else {
      optimisticCart = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          weight: product.weight,
          price: product.price,
          wholesale_price: product.wholesale_price,
          wholesale_min_qty: product.wholesale_min_qty || 1,
          emoji: product.emoji || "🌾",
          quantity: qty,
          image_url: product.image_url
        }
      ];
    }
    syncCartState(optimisticCart);

    toast.success(
      isWholesaleActive 
        ? `Added bulk order (${qty} kg) of ${product.name} to basket!`
        : `Added ${product.name} to basket!`
    );

    // 2. Background Write & Revalidation
    try {
      await addToCartDb({
        data: {
          productId: product.id,
          quantity: qty,
          userId: currentUser?.id
        }
      });
      fetchLatestCartFromServer();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add to basket.");
      fetchLatestCartFromServer();
    }
  };

  const updateQuantity = async (id: number, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await removeFromCart(id);
      return;
    }

    // 1. Optimistic Update
    const optimisticCart = cart.map(i => 
      i.id === id ? { ...i, quantity: newQty } : i
    );
    syncCartState(optimisticCart);

    // 2. Background Write & Revalidation
    try {
      await updateCartItemQuantityDb({
        data: {
          productId: id,
          quantity: newQty,
          userId: currentUser?.id
        }
      });
      fetchLatestCartFromServer();
    } catch (err) {
      console.error(err);
      fetchLatestCartFromServer();
    }
  };

  const removeFromCart = async (id: number) => {
    // 1. Optimistic Update
    const optimisticCart = cart.filter(i => i.id !== id);
    syncCartState(optimisticCart);
    toast.info("Item removed from basket");

    // 2. Background Write & Revalidation
    try {
      await removeFromCartDb({
        data: {
          productId: id,
          userId: currentUser?.id
        }
      });
      fetchLatestCartFromServer();
    } catch (err) {
      console.error(err);
      fetchLatestCartFromServer();
    }
  };

  // Checkout submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      toast.error("Please sign up to checkout.");
      window.location.href = "/login?mode=signup&redirect=/shop?checkout=true";
      return;
    }
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        user_id: currentUser.id,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        customer_phone: checkoutForm.phone,
        shipping_address: checkoutForm.address,
        total_amount: subtotal,
        items: cart.map((item) => {
          const appliedPrice =
            item.wholesale_price && item.quantity >= item.wholesale_min_qty
              ? item.wholesale_price
              : item.price;
          return {
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: appliedPrice
          };
        })
      };

      const result = await createOrder({ data: orderData });
      setCreatedOrderId(result.id);
      try {
        await clearCartDb({ data: { userId: currentUser.id } });
      } catch (err) {
        console.error("Failed to clear database cart:", err);
      }
      setCart([]);
      toast.success("Order Placed Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Toggle checklist utilities
  const handleCategoryToggle = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleBrandToggle = (brandName: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) ? prev.filter(name => name !== brandName) : [...prev, brandName]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedChannel("all");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSortOption("default");
    setInStockOnly(false);
    setHighRatingOnly(false);
  };

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    // 1. Search Query
    const matchesSearch = 
      !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 2. Channel Filter
    let matchesChannel = true;
    if (selectedChannel === "retail") {
      matchesChannel = true; 
    } else if (selectedChannel === "wholesale") {
      matchesChannel = !!p.wholesale_price;
    } else if (selectedChannel === "offers") {
      matchesChannel = p.discount > 0 || (p.old_price && p.old_price > p.price);
    }

    // 3. Category Filter
    const matchesCategory = 
      selectedCategories.length === 0 || 
      selectedCategories.includes(p.category_id);

    // 4. Brand Filter
    const matchesBrand = 
      selectedBrands.length === 0 || 
      selectedBrands.includes(p.brand);

    // 5. In Stock Only
    const matchesStock = !inStockOnly || p.stock;

    // 6. High Rating (4.5+)
    const matchesRating = !highRatingOnly || p.rating >= 4.5;

    return matchesSearch && matchesChannel && matchesCategory && matchesBrand && matchesStock && matchesRating;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-asc") {
      const priceA = selectedChannel === "wholesale" && a.wholesale_price ? a.wholesale_price : a.price;
      const priceB = selectedChannel === "wholesale" && b.wholesale_price ? b.wholesale_price : b.price;
      return priceA - priceB;
    }
    if (sortOption === "price-desc") {
      const priceA = selectedChannel === "wholesale" && a.wholesale_price ? a.wholesale_price : a.price;
      const priceB = selectedChannel === "wholesale" && b.wholesale_price ? b.wholesale_price : b.price;
      return priceB - priceA;
    }
    if (sortOption === "rating") {
      return b.rating - a.rating;
    }
    if (sortOption === "discount") {
      const discountA = a.old_price ? ((a.old_price - a.price) / a.old_price) : 0;
      const discountB = b.old_price ? ((b.old_price - b.price) / b.old_price) : 0;
      return discountB - discountA;
    }
    return 0; // default (no sort)
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground mt-4">Loading catalog data...</span>
      </div>
    );
  }

  // Sidebar component view (reusable for desktop & mobile drawer)
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* 1. Catalog Channel Selector */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" /> Catalog Type
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "all", label: "All Items" },
            { id: "retail", label: "Retail Shop" },
            { id: "wholesale", label: "Wholesale Mandi" },
            { id: "offers", label: "Special Offers" }
          ].map(ch => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`rounded-xl py-2 px-3 text-xs font-bold text-center border transition ${
                selectedChannel === ch.id
                  ? "bg-[#e8f7ee] text-emerald-700 border-primary shadow-sm"
                  : "bg-white text-slate-600 border-border hover:border-slate-300"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Search */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
          Search Products
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-8 py-2.5 text-xs text-slate-800 outline-none focus:border-primary transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Checklist */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
          Categories
        </h3>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => handleCategoryToggle(c.id)}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-bold hover:bg-slate-100/70 transition text-slate-600 hover:text-slate-800"
            >
              <span className="flex items-center gap-2">
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </span>
              <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                selectedCategories.includes(c.id) ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
              }`}>
                {selectedCategories.includes(c.id) && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Brands Checklist */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-primary" /> Partner Brands
        </h3>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => handleBrandToggle(b.name)}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-bold hover:bg-slate-100/70 transition text-slate-600 hover:text-slate-800"
            >
              <span>{b.name}</span>
              <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                selectedBrands.includes(b.name) ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
              }`}>
                {selectedBrands.includes(b.name) && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Quick Filters */}
      <div className="space-y-2.5 pt-2 border-t border-border">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
          Preferences
        </h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer select-none text-xs font-bold text-slate-600">
            <span>In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1">
              Rating 4.5+ <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            </span>
            <input
              type="checkbox"
              checked={highRatingOnly}
              onChange={(e) => setHighRatingOnly(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
          </label>
        </div>
      </div>

      {/* 6. Reset Filters */}
      <button
        onClick={clearAllFilters}
        className="w-full rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Premium Header with Basket drawer trigger */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-glow overflow-hidden">
              <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight">Nadeem<span className="text-primary">Traders</span></div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Karyana • Gala Mandi</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-primary transition">Return to Store</Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="group relative flex items-center gap-2 rounded-2xl bg-gradient-primary px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-glow"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Basket</span>
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 relative">
        
        {/* Desktop Sidebar (1/4 Width) */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white border border-border rounded-[32px] p-6 shadow-soft self-start sticky top-24">
          <FilterSidebarContent />
        </aside>

        {/* Product Grid Area (3/4 Width) */}
        <main className="flex-1 space-y-6">
          
          {/* Controls Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-border rounded-[28px] p-4 sm:p-5 shadow-soft">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 capitalize">
                {selectedChannel === "all" ? "Our Full Catalog" : `${selectedChannel} Products`}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Showing {sortedProducts.length} items matching your criteria.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Trigger */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4 text-primary" /> Filters
              </button>

              {/* Sorting Select */}
              <div className="relative flex items-center gap-1 text-xs">
                <span className="text-slate-400 font-semibold hidden md:inline">Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-xl border border-border bg-white pl-3 pr-8 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="default">Default Sort</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="discount">Biggest Savings</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-3 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>

          {/* Active Chips List */}
          {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery || selectedChannel !== "all" || inStockOnly || highRatingOnly) && (
            <div className="flex flex-wrap items-center gap-2 bg-[#f0fdf4]/30 rounded-2xl p-3 border border-emerald-500/10">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 pl-1 mr-1">Active:</span>
              
              {selectedChannel !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Channel: {selectedChannel}
                  <button onClick={() => setSelectedChannel("all")} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}

              {selectedCategories.map(catId => {
                const name = categories.find(c => c.id === catId)?.name || `Cat #${catId}`;
                return (
                  <span key={catId} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                    Category: {name}
                    <button onClick={() => handleCategoryToggle(catId)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                );
              })}

              {selectedBrands.map(bName => (
                <span key={bName} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Brand: {bName}
                  <button onClick={() => handleBrandToggle(bName)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              ))}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}

              {highRatingOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Rating 4.5+
                  <button onClick={() => setHighRatingOnly(false)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-wider ml-auto pr-1"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid Area */}
          {sortedProducts.length === 0 ? (
            <div className="bg-white border border-border rounded-[32px] py-20 text-center text-slate-400 text-xs shadow-soft space-y-2">
              <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">No products match your active filters</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Try resetting selected categories, brands, or refining your search query keyword.</p>
              <button 
                onClick={clearAllFilters}
                className="mt-4 rounded-xl bg-gradient-primary text-white px-4 py-2 font-bold hover:shadow-glow transition text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {sortedProducts.map((p) => {
                const retailPrice = p.price;
                const wholesalePrice = p.wholesale_price || p.price;
                
                // Active state wholesale checking
                const showAsWholesale = selectedChannel === "wholesale" && !!p.wholesale_price;
                const activePrice = showAsWholesale ? wholesalePrice : retailPrice;
                
                // discount calculations
                const savePercent = p.old_price && p.old_price > p.price
                  ? Math.round(((p.old_price - p.price) / p.old_price) * 100)
                  : p.discount;

                const wholesaleSavePercent = p.price > p.wholesale_price
                  ? Math.round(((p.price - p.wholesale_price) / p.price) * 100)
                  : 0;

                return (
                  <div 
                    key={p.id} 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant h-[360px] text-left"
                  >
                    {/* Image / Emoji container linking to detail */}
                    <a href={`/product/${p.id}`} className="absolute inset-0 w-full h-full">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-103" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#d1fae5]/35 to-[#d1fae5]/10 flex items-center justify-center">
                          <span className="text-7xl drop-shadow-md select-none">{p.emoji || "🌾"}</span>
                        </div>
                      )}
                    </a>

                    {/* Tag badge (Top right / Left overlay) */}
                    <div className="relative p-4 flex justify-between items-start z-10 pointer-events-none">
                      {showAsWholesale ? (
                        <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm pointer-events-auto">
                          Wholesale
                        </span>
                      ) : savePercent > 0 ? (
                        <span className="rounded-full bg-gradient-gold px-2.5 py-0.5 text-[9px] font-black text-gold-foreground shadow-soft pointer-events-auto">
                          -{savePercent}% OFF
                        </span>
                      ) : <div />}

                      {!p.stock && (
                        <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[9px] font-extrabold uppercase pointer-events-auto">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Bottom Info Section with overlay gradient */}
                    <div className="mt-auto relative z-10 p-4 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent text-white">
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                        <span className="text-emerald-400 font-extrabold">{p.brand}</span>
                        <span>{p.weight}</span>
                      </div>
                      
                      <a href={`/product/${p.id}`} className="hover:text-emerald-400 transition mt-1 block">
                        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-slate-50">{p.name}</h3>
                      </a>

                      {/* Ratings */}
                      <div className="flex items-center gap-1 text-[10px] mt-1 text-slate-300">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        <span className="font-extrabold text-white">{p.rating}</span>
                        <span>({p.reviews} reviews)</span>
                      </div>

                      {/* Price row */}
                      <div className="flex items-center justify-between gap-2 pt-3 mt-2.5 border-t border-white/10">
                        <div>
                          <div className="text-sm sm:text-base font-black text-emerald-400">
                            Rs. {activePrice}
                            {showAsWholesale && <span className="text-[9px] font-normal text-slate-300">/kg</span>}
                          </div>
                          {showAsWholesale ? (
                            <div className="text-[9px] text-slate-300 font-semibold line-through">
                              Retail: Rs. {retailPrice}/kg
                            </div>
                          ) : p.old_price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              Rs. {p.old_price}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={!p.stock}
                          className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow pointer-events-auto transition disabled:opacity-50"
                          title={showAsWholesale ? `Order wholesale min quantity: ${p.wholesale_min_qty || 5} kg` : "Add to Basket"}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {showAsWholesale && (
                        <div className="text-[8px] sm:text-[9px] text-amber-300 font-bold mt-1 text-center">
                          Min Order: {p.wholesale_min_qty || 5} kg ({wholesaleSavePercent > 0 ? `Save ${wholesaleSavePercent}%` : `Bulk Rate`})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Slide-over Filter Panel */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs transform bg-white shadow-2xl transition duration-300 ease-in-out flex flex-col justify-between">
              
              {/* Header */}
              <div className="border-b border-border p-4 flex items-center justify-between">
                <h2 className="text-sm font-black flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-primary" /> Filter Options
                </h2>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-xl p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Filters */}
              <div className="flex-1 overflow-y-auto p-5">
                <FilterSidebarContent />
              </div>

              {/* View Results Button */}
              <div className="border-t border-border p-4 bg-slate-50">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full rounded-2xl bg-gradient-primary py-3.5 text-xs font-bold text-white shadow-elegant hover:shadow-glow text-center"
                >
                  Show {sortedProducts.length} Results
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. Sliding Shopping Cart Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-card text-foreground shadow-2xl transition duration-300 ease-in-out flex flex-col justify-between">
              <div className="border-b border-border p-6 flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Your Basket
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="rounded-xl p-2 hover:bg-accent text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <ShoppingBag className="h-16 w-16 mb-4 text-primary/30" />
                    <p className="font-semibold text-sm">Your basket is empty.</p>
                    <p className="text-xs mt-1">Add items from the catalog section to see them here.</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const retailCost = item.price * item.quantity;
                    const actualPrice =
                      item.wholesale_price && item.quantity >= item.wholesale_min_qty
                        ? item.wholesale_price
                        : item.price;
                    const actualCost = actualPrice * item.quantity;
                    const saved = retailCost - actualCost;

                    return (
                      <div key={item.id} className="flex items-center gap-4 bg-accent/30 border border-border/50 p-4 rounded-2xl relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-mint flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-border">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.emoji
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-800 truncate">{item.name}</h4>
                          <span className="text-[10px] text-muted-foreground block">{item.brand} • {item.weight}</span>
                          <span className="text-xs font-extrabold text-primary block mt-1">
                            Rs. {actualPrice} {item.wholesale_price && item.quantity >= item.wholesale_min_qty && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded">Wholesale</span>}
                          </span>
                          {saved > 0 && (
                            <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">Saved Rs. {saved.toLocaleString()} (Bulk savings)</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 rounded-lg p-1">
                            <X className="h-4 w-4" />
                          </button>
                          <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2.5 py-1 hover:bg-accent text-slate-500">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-slate-700">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2.5 py-1 hover:bg-accent text-slate-500">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-border p-6 bg-accent/20">
                  {savings > 0 && (
                    <div className="flex justify-between items-center mb-3 text-xs bg-emerald-100/50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl font-bold">
                      <span>Bulk Savings Applied:</span>
                      <span>Rs. {savings.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-muted-foreground text-sm">Grand Total</span>
                    <span className="font-black text-xl text-primary">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      if (!currentUser) {
                        toast.info("Please sign up to checkout.");
                        window.location.href = "/login?mode=signup&redirect=/shop?checkout=true";
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow transition"
                  >
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Checkout Dialog / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          <div className="relative w-full max-w-lg bg-card text-foreground rounded-3xl border border-border p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute right-4 top-4 rounded-xl p-2 hover:bg-accent text-muted-foreground">
              <X className="h-5 w-5" />
            </button>

            {createdOrderId ? (
              <div className="text-center py-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-800 mb-6">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Order Placed!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for shopping at Nadeem Traders. Your order has been registered under:
                </p>
                <div className="bg-accent/40 rounded-2xl p-4 my-6 border border-border inline-block">
                  <span className="text-xs text-muted-foreground uppercase font-bold block tracking-wider">Your Order ID</span>
                  <span className="text-2xl font-black text-primary block mt-1">#{createdOrderId}</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We have sent an order status confirmation email to <span className="font-semibold text-slate-700">{checkoutForm.email}</span>. You can view your account profile dashboard to see your orders details.
                </p>
                <div className="flex gap-4 mt-8 max-w-xs mx-auto">
                  <Link
                    to="/dashboard"
                    className="flex-1 py-3 text-xs font-bold text-center border border-border rounded-xl hover:bg-accent transition"
                  >
                    View Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setCreatedOrderId(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="flex-1 py-3 text-xs font-bold text-white bg-gradient-primary rounded-xl hover:brightness-105 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-slate-800 border-b border-border pb-3 mb-6">Ration Details Checkout</h3>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Your Full Name"
                        className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="mt-1 w-full rounded-xl border border-border bg-background text-foreground px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      placeholder="e.g. 03001234567"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Shipping Address</label>
                    <textarea
                      required
                      rows={3}
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="House No, Street Name, Area name, City (e.g. Lahore, Karachi)"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4 flex gap-3 mt-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">Cash on Delivery</h4>
                      <p className="text-[10px] text-emerald-700/80 leading-relaxed mt-0.5">
                        Paying cash on delivery is the only method available. Please verify order total amount at your door.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-6 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Order Subtotal</span>
                    <span className="font-extrabold text-primary">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elegant hover:shadow-glow disabled:opacity-50 transition mt-6"
                  >
                    {isSubmittingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm COD Purchase (Rs. {subtotal.toLocaleString()})
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
