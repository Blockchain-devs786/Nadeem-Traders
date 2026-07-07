import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, Mic, ShoppingCart, Heart, User, MapPin, Menu, Phone,
  Star, Truck, ShieldCheck, Headphones, Leaf, Wallet, Clock,
  ChevronRight, Facebook, Instagram, Youtube, Mail, MessageCircle,
  Plus, Minus, Zap, Package, Award, TrendingUp, ArrowRight,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HaraBazaar — Pakistan's Trusted Online Karyana & Gala Mandi" },
      { name: "description", content: "Fresh groceries, fruits, vegetables, spices, rice, atta and wholesale Gala Mandi prices delivered across Pakistan." },
    ],
  }),
  component: Home,
});

/* -------------------- data -------------------- */

const categories = [
  { icon: "🥦", name: "Vegetables" }, { icon: "🍎", name: "Fruits" },
  { icon: "🌾", name: "Rice" }, { icon: "🌾", name: "Atta" },
  { icon: "🥜", name: "Pulses" }, { icon: "🌶️", name: "Spices" },
  { icon: "🧂", name: "Salt & Sugar" }, { icon: "🛢️", name: "Oil & Ghee" },
  { icon: "🥛", name: "Dairy" }, { icon: "🥤", name: "Beverages" },
  { icon: "🍪", name: "Snacks" }, { icon: "🍫", name: "Chocolates" },
  { icon: "🍜", name: "Noodles" }, { icon: "🧴", name: "Personal Care" },
  { icon: "🧹", name: "Household" }, { icon: "🧺", name: "Cleaning" },
  { icon: "🐔", name: "Meat" }, { icon: "🐟", name: "Seafood" },
  { icon: "🥚", name: "Eggs" }, { icon: "🌰", name: "Dry Fruits" },
  { icon: "🥜", name: "Nuts" }, { icon: "🌽", name: "Animal Feed" },
  { icon: "🏪", name: "Gala Mandi" },
];

const products = [
  { name: "Basmati Rice Super Kernel", brand: "Guard", weight: "5 KG", price: 2450, old: 2999, rating: 4.8, reviews: 1204, discount: 18, emoji: "🌾", stock: true },
  { name: "Chakki Fresh Atta", brand: "Sufi", weight: "10 KG", price: 1590, old: 1850, rating: 4.7, reviews: 892, discount: 14, emoji: "🌾", stock: true },
  { name: "Cooking Oil Tin", brand: "Dalda", weight: "5 Ltr", price: 3299, old: 3899, rating: 4.9, reviews: 2103, discount: 15, emoji: "🛢️", stock: true },
  { name: "Chilli Powder", brand: "Shan", weight: "400 g", price: 420, old: 520, rating: 4.6, reviews: 640, discount: 19, emoji: "🌶️", stock: true },
  { name: "Full Cream Milk", brand: "Olper's", weight: "1 Ltr", price: 320, old: 350, rating: 4.5, reviews: 415, discount: 8, emoji: "🥛", stock: true },
  { name: "Danedar Tea", brand: "Tapal", weight: "950 g", price: 1780, old: 1990, rating: 4.7, reviews: 998, discount: 10, emoji: "🍵", stock: true },
  { name: "Masoor Daal", brand: "National", weight: "1 KG", price: 480, old: 560, rating: 4.6, reviews: 302, discount: 14, emoji: "🥜", stock: true },
  { name: "Vermicelli", brand: "Mitchell's", weight: "150 g", price: 145, old: 170, rating: 4.4, reviews: 178, discount: 15, emoji: "🍜", stock: false },
];

const wholesale = [
  { name: "Onion (Piyaz)", retail: 120, whole: 85, emoji: "🧅" },
  { name: "Potato (Aloo)", retail: 90, whole: 62, emoji: "🥔" },
  { name: "Tomato (Tamatar)", retail: 140, whole: 95, emoji: "🍅" },
  { name: "Garlic (Lehsan)", retail: 480, whole: 360, emoji: "🧄" },
  { name: "Ginger (Adrak)", retail: 620, whole: 470, emoji: "🫚" },
  { name: "Mango Chaunsa", retail: 320, whole: 220, emoji: "🥭" },
  { name: "Apple Kala Kulu", retail: 380, whole: 260, emoji: "🍎" },
  { name: "Banana", retail: 180, whole: 120, emoji: "🍌" },
  { name: "Orange Kinnow", retail: 160, whole: 105, emoji: "🍊" },
  { name: "Green Chilli", retail: 220, whole: 150, emoji: "🌶️" },
];

const brands = ["Shan", "National", "Tapal", "Lipton", "Dalda", "Sufi", "Guard", "Olper's", "Nestlé", "Knorr", "Mitchell's", "Everyday"];

const reasons = [
  { icon: Leaf, title: "Fresh Products", desc: "Farm-to-door quality, every day." },
  { icon: Truck, title: "Fast Delivery", desc: "Same-day across major cities." },
  { icon: Wallet, title: "Wholesale Prices", desc: "Real Gala Mandi rates." },
  { icon: ShieldCheck, title: "Trusted Sellers", desc: "Verified vendors only." },
  { icon: Award, title: "Secure Payments", desc: "COD, EasyPaisa, JazzCash & cards." },
  { icon: Headphones, title: "24/7 Support", desc: "We're here whenever you need us." },
];

const testimonials = [
  { name: "Ayesha Khan", city: "Karachi", text: "Fresh sabziyan har din, aur delivery bohat fast. HaraBazaar meri ration ki jaan ban gaya hai!", rating: 5 },
  { name: "Bilal Ahmed", city: "Lahore", text: "Wholesale rates for my dhaba are unbeatable. Bulk atta and oil orders always on time.", rating: 5 },
  { name: "Sana Malik", city: "Islamabad", text: "Packaging bohat safe hoti hai and prices genuinely better than local Karyana.", rating: 4 },
];

/* -------------------- page -------------------- */

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <FlashSale />
      <Brands />
      <Wholesale />
      <WhyUs />
      <Testimonials />
      <AppPromo />
      <Newsletter />
      <Footer />
    </div>
  );
}

/* -------------------- header -------------------- */

function TopBar() {
  return (
    <div className="bg-gradient-primary text-primary-foreground text-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Delivering across Pakistan</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Phone className="h-3.5 w-3.5" /> 0800-HARA (4272)</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <a className="hover:opacity-80" href="#">Sell on HaraBazaar</a>
          <a className="hover:opacity-80" href="#">Track Order</a>
          <a className="hover:opacity-80" href="#">Help</a>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="lg:hidden rounded-xl p-2 hover:bg-accent"><Menu className="h-5 w-5" /></button>
        <a href="#" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">Hara<span className="text-primary">Bazaar</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Karyana • Gala Mandi</div>
          </div>
        </a>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <IconBtn label="Wishlist" count={3}><Heart className="h-5 w-5" /></IconBtn>
          <IconBtn label="Account"><User className="h-5 w-5" /></IconBtn>
          <a href="#" className="group relative flex items-center gap-2 rounded-2xl bg-gradient-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-glow">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">2</span>
          </a>
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/50">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2 text-sm font-medium">
          {["All Categories", "Fresh Deals", "Gala Mandi", "Groceries", "Brands", "Ramzan Specials", "Wholesale", "Bulk Orders"].map((l, i) => (
            <a key={l} href="#" className={`whitespace-nowrap transition-colors hover:text-primary ${i === 0 ? "flex items-center gap-1.5 text-primary" : "text-muted-foreground"}`}>
              {i === 0 && <Menu className="h-4 w-4" />} {l}
            </a>
          ))}
        </div>
      </div>

      <div className="md:hidden border-t border-border/50 px-4 py-3">
        <SearchBar />
      </div>
    </header>
  );
}

function IconBtn({ children, label, count }: { children: React.ReactNode; label: string; count?: number }) {
  return (
    <button aria-label={label} className="relative rounded-xl p-2.5 hover:bg-accent transition">
      {children}
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">{count}</span>
      ) : null}
    </button>
  );
}

function SearchBar() {
  return (
    <div className="group flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-soft transition focus-within:border-primary focus-within:shadow-glow">
      <Search className="h-5 w-5 text-muted-foreground" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Search products, brands and categories…"
      />
      <button className="hidden rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-primary sm:block" aria-label="Voice search">
        <Mic className="h-4 w-4" />
      </button>
      <button className="rounded-xl bg-gradient-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Search</button>
    </div>
  );
}

/* -------------------- hero -------------------- */

function Hero() {
  return (
    <section className="relative min-h-[550px] lg:min-h-[650px] overflow-hidden flex items-center bg-black text-white py-14 lg:py-20">
      {/* Background Video */}
      <video
        src="/promo.mp4"
        poster={heroImg}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      {/* Dark overlay with left-to-right gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
      
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl w-full items-center gap-10 px-4 lg:grid-cols-2 z-10">
        {/* Left Column: Text, Stats & Mandi Rate */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Zap className="h-3.5 w-3.5 text-primary" /> Free delivery over Rs. 1,500
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl text-white">
            Pakistan's Trusted{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Online Karyana</span>{" "}
            & Gala Mandi Marketplace
          </h1>
          <p className="mt-5 max-w-xl text-base text-gray-200 sm:text-lg">
            Fresh groceries, wholesale prices, fast delivery, and trusted quality — everything your kitchen and business needs, in one green basket.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:shadow-glow">
              Shop Now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a href="#categories" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur px-6 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary transition">
              Explore Categories
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "50K+", v: "Happy Buyers" },
              { k: "10K+", v: "Products" },
              { k: "60+", v: "Cities" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
                <div className="text-xl font-extrabold text-emerald-400">{s.k}</div>
                <div className="text-xs text-gray-300">{s.v}</div>
              </div>
            ))}
          </div>

          {/* Integrated Mandi Rate Card */}
          <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between max-w-md">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-gray-300">Today's Mandi Rate</div>
              <div className="truncate text-xs font-bold text-white mt-0.5">Onion Rs. 85/kg · Potato Rs. 62/kg · Tomato Rs. 95/kg</div>
            </div>
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400 ml-2" />
          </div>
        </div>

        {/* Right Column: Branding Overlay */}
        <div className="relative flex items-center justify-center lg:justify-end min-h-[250px] lg:min-h-[400px]">
          {/* Nadeem Traders Badge centered in the right column */}
          <div className="text-center px-8 py-6 rounded-[28px] bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-[0_0_50px_rgba(244,180,0,0.2)] max-w-full transform transition hover:scale-105 duration-500">
            <h2 className="text-4xl sm:text-6xl font-black tracking-wider text-gold bg-gradient-gold bg-clip-text text-transparent font-serif drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-pulse">
              Nadeem Traders
            </h2>
            <p className="text-xs sm:text-sm tracking-[0.3em] text-emerald-300 font-extrabold uppercase mt-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              Premium Spices & Karyana
            </p>
          </div>

          {/* Floating Badges */}
          <div className="absolute -left-4 top-8 hidden animate-float rounded-2xl bg-white/10 border border-white/10 backdrop-blur px-4 py-3 shadow-elegant sm:block z-20">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/20 text-gold text-lg font-bold">%</div>
              <div className="leading-tight text-white">
                <div className="text-xs text-gray-300">Flash Sale</div>
                <div className="text-sm font-bold">Up to 40% off</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 bottom-8 hidden animate-float rounded-2xl bg-white/10 border border-white/10 backdrop-blur px-4 py-3 shadow-elegant sm:block z-20" style={{ animationDelay: "1s" }}>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 text-primary"><Truck className="h-5 w-5 text-emerald-300" /></div>
              <div className="leading-tight text-white">
                <div className="text-xs text-gray-300">Fast delivery</div>
                <div className="text-sm font-bold">Under 90 minutes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- categories -------------------- */

function Categories() {
  return (
    <section id="categories" className="relative mx-auto max-w-7xl px-4 py-16 overflow-hidden rounded-[32px] my-4">
      {/* Soft organic glow */}
      <div className="pointer-events-none absolute left-1/3 top-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-gold/5 blur-3xl" />
      
      <div className="relative z-10">
        <SectionHead eyebrow="Shop by need" title="Explore Categories" subtitle="From daily sabzi to bulk Gala Mandi — everything in one basket." />
        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.map((c) => (
            <a key={c.name} href="#" className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-center shadow-soft transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-elegant">
              <div className="absolute inset-x-0 -top-8 h-16 bg-gradient-primary opacity-0 blur-2xl transition group-hover:opacity-40" />
              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-3xl transition group-hover:scale-110">
                <span>{c.icon}</span>
              </div>
              <div className="relative mt-2 truncate text-xs font-semibold">{c.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- featured products -------------------- */

function FeaturedProducts() {
  return (
    <section id="products" className="relative mx-auto max-w-7xl px-4 py-16 overflow-hidden rounded-[32px] my-4">
      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute right-1/3 top-10 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 bottom-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10">
        <SectionHead eyebrow="Best sellers" title="Featured Products" subtitle="Hand-picked essentials your ghar can't run out of." action="View all" />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.name} {...p} />)}
        </div>
      </div>
    </section>
  );
}

function ProductCard(p: (typeof products)[number]) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
      <div className="relative aspect-square overflow-hidden bg-gradient-mint">
        <div className="absolute inset-0 grid place-items-center text-8xl transition duration-500 group-hover:scale-110">{p.emoji}</div>
        {p.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-gold-foreground shadow-soft">-{p.discount}%</span>
        )}
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-muted-foreground shadow-soft backdrop-blur transition hover:text-primary" aria-label="Wishlist">
          <Heart className="h-4 w-4" />
        </button>
        {!p.stock && (
          <span className="absolute inset-x-3 bottom-3 rounded-xl bg-destructive/90 py-1 text-center text-xs font-semibold text-destructive-foreground">Out of stock</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">{p.brand}</span>
          <span className="text-muted-foreground">{p.weight}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{p.name}</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="font-bold">{p.rating}</span>
          <span className="text-muted-foreground">({p.reviews})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div className="text-lg font-extrabold text-primary">Rs. {p.price.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground line-through">Rs. {p.old.toLocaleString()}</div>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft transition hover:shadow-glow" aria-label="Add to cart">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- flash sale -------------------- */

function FlashSale() {
  const [t, setT] = useState({ h: 5, m: 42, s: 18 });
  useEffect(() => {
    const id = setInterval(() => {
      setT(({ h, m, s }) => {
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-elegant sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
              <Zap className="h-3.5 w-3.5" /> FLASH SALE
            </span>
            <h3 className="mt-4 text-3xl font-extrabold sm:text-4xl">Save up to 40% on daily essentials</h3>
            <p className="mt-2 max-w-md text-primary-foreground/85">Fresh sabzi, cooking oil, atta and more — but only for the next few hours.</p>
            <a href="#" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-bold text-primary transition hover:bg-white">
              Grab the deals <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="flex gap-3">
            {[
              { l: "Hours", v: pad(t.h) },
              { l: "Minutes", v: pad(t.m) },
              { l: "Seconds", v: pad(t.s) },
            ].map((u) => (
              <div key={u.l} className="w-20 rounded-2xl bg-white/15 p-4 text-center backdrop-blur sm:w-24">
                <div className="text-3xl font-extrabold tabular-nums sm:text-4xl">{u.v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">{u.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- brands -------------------- */

function Brands() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHead eyebrow="You know & trust" title="Popular Brands" subtitle="Authentic Pakistani brands, direct from authorized distributors." />
      <div className="mt-8 overflow-hidden">
        <div className="flex w-max animate-marquee gap-4">
          {[...brands, ...brands].map((b, i) => (
            <div key={i} className="grid h-24 w-40 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:border-primary hover:shadow-elegant">
              <span className="text-xl font-extrabold tracking-tight text-primary">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- wholesale -------------------- */

function Wholesale() {
  return (
    <section className="bg-mint py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              <Package className="h-3.5 w-3.5" /> GALA MANDI WHOLESALE
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Bulk rates for dhabas, hotels & families</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Real Sabzi Mandi prices, transparent per-kg breakdown, and delivery in bulk.</p>
          </div>
          <a href="#" className="inline-flex items-center gap-2 rounded-2xl bg-card px-4 py-2.5 text-sm font-semibold hover:text-primary">
            View all wholesale <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wholesale.map((w) => {
            const save = Math.round(((w.retail - w.whole) / w.retail) * 100);
            return (
              <div key={w.name} className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-mint text-4xl">{w.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold">{w.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Save {save}%</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3 text-sm">
                    <span className="text-muted-foreground line-through">Rs. {w.retail}/kg</span>
                    <span className="text-lg font-extrabold text-primary">Rs. {w.whole}/kg</span>
                  </div>
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground transition hover:shadow-glow" aria-label="Bulk order">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------- why us -------------------- */

function WhyUs() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 overflow-hidden rounded-[32px] my-4">
      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute left-1/3 top-12 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 bottom-12 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />

      <div className="relative z-10">
        <SectionHead eyebrow="Why HaraBazaar" title="Built for Pakistani kitchens & businesses" />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-elegant">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition group-hover:scale-110">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- testimonials -------------------- */

function Testimonials() {
  return (
    <section className="bg-mint py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead eyebrow="Loved across Pakistan" title="What our customers say" />
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-2xl bg-gradient-primary text-lg text-primary-foreground shadow-glow">“</div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{t.text}</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary font-bold text-primary-foreground">{t.name[0]}</div>
                <div>
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- app promo + newsletter -------------------- */

function AppPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card shadow-elegant">
        <div className="absolute inset-0 bg-gradient-mint" />
        <div className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Clock className="h-3.5 w-3.5" /> Grocery in your pocket
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Get the HaraBazaar app</h2>
            <p className="mt-3 max-w-md text-muted-foreground">Track orders, get flash-sale alerts, and save your favourite ration list — right from your phone.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#" className="flex items-center gap-3 rounded-2xl bg-foreground px-5 py-3 text-background shadow-soft transition hover:opacity-90">
                <div className="text-2xl">📱</div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] uppercase opacity-80">Download on</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 rounded-2xl bg-gradient-primary px-5 py-3 text-primary-foreground shadow-soft transition hover:shadow-glow">
                <div className="text-2xl">🤖</div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] uppercase opacity-90">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="relative min-h-[260px]">
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid grid-cols-2 gap-4">
                {["🥬", "🌾", "🌶️", "🥛"].map((e, i) => (
                  <div key={i} className="grid h-24 w-24 place-items-center rounded-3xl bg-card text-5xl shadow-elegant animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                    {e}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="rounded-3xl border border-border bg-gradient-primary p-8 text-primary-foreground shadow-elegant sm:p-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="min-w-0">
            <h3 className="text-2xl font-extrabold sm:text-3xl">Subscribe & save Rs. 200</h3>
            <p className="mt-2 text-primary-foreground/90">Join 50,000+ subscribers and get weekly Mandi rates and exclusive deals.</p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="your@email.com" className="min-w-0 flex-1 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm placeholder:text-primary-foreground/70 outline-none focus:border-white" />
            <button className="rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground shadow-soft transition hover:brightness-105">Subscribe</button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* -------------------- footer -------------------- */

function Footer() {
  const cols = [
    { title: "Quick Links", items: ["Home", "Shop", "Gala Mandi", "Brands", "Offers", "Track Order"] },
    { title: "Customer Care", items: ["Contact Us", "Help Center", "Delivery Info", "Bulk Orders", "Sell with Us"] },
    { title: "Policies", items: ["Privacy Policy", "Terms of Use", "Refund Policy", "Shipping Policy", "Cookie Policy"] },
  ];
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-lg font-extrabold">Hara<span className="text-primary">Bazaar</span></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Pakistan's trusted online Karyana & Gala Mandi marketplace — fresh, affordable, and delivered fast.</p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Youtube, MessageCircle, Mail].map((I, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/80">{c.title}</h4>
              <ul className="mt-4 space-y-2 text-sm">
                {c.items.map((i) => (
                  <li key={i}><a href="#" className="text-muted-foreground transition hover:text-primary">{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} HaraBazaar. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-3">
            <span>We accept:</span>
            {["COD", "EasyPaisa", "JazzCash", "Visa", "Master", "Bank"].map((p) => (
              <span key={p} className="rounded-lg border border-border bg-background px-2 py-1 font-semibold">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------- helpers -------------------- */

function SectionHead({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <a href="#" className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">
          {action} <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

// suppress unused warning for reserved import
void Minus;
