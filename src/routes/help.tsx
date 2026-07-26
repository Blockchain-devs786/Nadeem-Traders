import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ChevronRight, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — Nadeem Traders" },
      { name: "description", content: "Frequently asked questions about ordering, bulk wholesale rates, and accounts." }
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const faqs = [
    {
      q: "How does Google Authentication keep my session safe?",
      a: "We integrate Google Sign-In using secure OAuth 2.0. By using official client libraries, we request authentication tokens verified directly by Google. Your session keys are stored on HTTP-only secure cookies which are inaccessible to JavaScript, protecting your account from theft or cross-site scripting (XSS)."
    },
    {
      q: "Can I add items to my shopping cart without signing in?",
      a: "Yes! Guests can browse the entire catalog, search for spices and flour, and add items to their shopping cart freely. You only need to verify your account via Google Sign-In when proceeding to checkout."
    },
    {
      q: "How are my guest cart items preserved when I log in?",
      a: "When you log in, our cloud database automatically queries all items currently in your guest session cart and merges them directly into your Google profile. Duplicate items will have their quantities summed, preserving your shopping progress."
    },
    {
      q: "Do you ship bulk wholesale items to all cities in Pakistan?",
      a: "Yes, we ship nationwide! Wholesale orders are dispatched directly from our central trade hubs and shipped through reputable logistics partners. Shipping charges and delivery times vary by destination."
    },
    {
      q: "How can I earn reward points?",
      a: "New customers are automatically awarded 100 welcome reward points upon their first Google sign-in. Additional points are accrued on every purchase and can be redeemed for coupon discounts."
    }
  ];

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
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition">Return to Shop</Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <HelpCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Help Center & FAQs</h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Find answers to commonly asked questions regarding authentication security, guest carts, reward points, and wholesale ordering.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-emerald-900/15 rounded-3xl p-5 md:p-6 space-y-2">
              <h3 className="font-bold text-sm text-slate-100 flex items-start gap-2.5">
                <span className="text-primary mt-0.5">Q.</span> {faq.q}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
