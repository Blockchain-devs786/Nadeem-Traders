import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Cookie } from "lucide-react";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Nadeem Traders" },
      { name: "description", content: "Details on how session tokens and cookies are used on the portal." }
    ],
  }),
  component: CookiePage,
});

function CookiePage() {
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

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12 space-y-6 text-xs text-slate-400 leading-relaxed">
        <div className="text-center space-y-3 mb-8">
          <Cookie className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Cookie Policy</h1>
          <p className="text-[11px] text-slate-500">Last updated: July 2026</p>
        </div>

        <h3 className="font-bold text-sm text-slate-200 mt-6">1. Session Tokens</h3>
        <p>
          We use secure HTTP-only session cookies to confirm active Google authentication logins. Since these cookies are inaccessible to frontend scripts, they protect your login credentials from CSRF.
        </p>

        <h3 className="font-bold text-sm text-slate-200 mt-6">2. Cart Persistence</h3>
        <p>
          Guest sessions use a secure UUID cookie to preserve items added to your shopping cart before you log in. Once you sign in with Google, this data is merged into your permanent cloud registry and the guest cookie is deleted.
        </p>
      </main>
    </div>
  );
}
