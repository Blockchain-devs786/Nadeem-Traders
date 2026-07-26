import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Store, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sell-with-us")({
  head: () => ({
    meta: [
      { title: "Sell With Us — Nadeem Traders" },
      { name: "description", content: "Onboard as a supplier, merchant, or wholesale partner with Nadeem Traders." }
    ],
  }),
  component: SellWithUsPage,
});

function SellWithUsPage() {
  const [form, setForm] = useState({ supplierName: "", city: "", phone: "", catalogType: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Thank you! Your merchant partner application has been filed. Our supply chain team will contact you back.");
      setForm({ supplierName: "", city: "", phone: "", catalogType: "" });
      setSubmitting(false);
    }, 800);
  };

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

      <main className="flex-1 mx-auto max-w-xl w-full px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <Store className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Sell With Us</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Expand your merchant reach by distributing fresh spices, pulses, rice, or general store products through Nadeem Traders supply networks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/30 border border-emerald-900/20 rounded-[32px] p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier / Brand Name</label>
            <input
              required
              type="text"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Operating City</label>
            <input
              required
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Lahore, Faisalabad, Multan..."
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WhatsApp / Phone Contact</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Categories Available</label>
            <textarea
              required
              rows={3}
              value={form.catalogType}
              onChange={(e) => setForm({ ...form, catalogType: e.target.value })}
              placeholder="Explain product types (e.g. Spices importer, mill owner, wholesale distributor)..."
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> Partner Request
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
