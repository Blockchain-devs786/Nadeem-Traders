import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nadeem Traders" },
      { name: "description", content: "Understand how your personal credentials and session data are managed securely." }
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
          <Shield className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          <p className="text-[11px] text-slate-500">Last updated: July 2026</p>
        </div>

        <h3 className="font-bold text-sm text-slate-200 mt-6">1. Information Collection</h3>
        <p>
          We only collect personal information linked to your Google profile upon secure Google Authentication (specifically Name, Email Address, and Profile picture). We do not store or collect passwords or any credit card credential.
        </p>

        <h3 className="font-bold text-sm text-slate-200 mt-6">2. Session Cookie Cookies</h3>
        <p>
          We employ HTTP-only cookies to secure sessions. These keys verify request authentication, block cross-site request forgery (CSRF), and merge guest shopping carts into user profiles once they register.
        </p>

        <h3 className="font-bold text-sm text-slate-200 mt-6">3. Data Sharing</h3>
        <p>
          Nadeem Traders does not sell or distribute user logs, phone numbers, or addresses to third-party aggregators. Address information is shared strictly with dispatch logistics teams to complete wholesale shipping.
        </p>
      </main>
    </div>
  );
}
