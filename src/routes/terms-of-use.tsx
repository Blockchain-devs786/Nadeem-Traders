import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, FileText } from "lucide-react";

export const Route = createFileRoute("/terms-of-use")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Nadeem Traders" },
      { name: "description", content: "Terms of service and user compliance conditions." }
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <FileText className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Terms of Use</h1>
          <p className="text-[11px] text-slate-500">Last updated: July 2026</p>
        </div>

        <h3 className="font-bold text-sm text-slate-200 mt-6">1. Acceptance of Terms</h3>
        <p>
          By accessing and browsing Nadeem Traders, you agree to comply with our commercial guidelines. All orders placed are subject to stock availability and logistics validation.
        </p>

        <h3 className="font-bold text-sm text-slate-200 mt-6">2. Account Registration</h3>
        <p>
          Users must verify their session credentials using Google Auth. You agree not to spoof devices, tamper with cookies, or attempt to bypass secure route gates.
        </p>

        <h3 className="font-bold text-sm text-slate-200 mt-6">3. Wholesale Prices</h3>
        <p>
          Real-time Gala Mandi rates are subject to daily price fluctuations. We reserve the right to cancel or amend orders if errors are found in catalog prices.
        </p>
      </main>
    </div>
  );
}
