import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, FileSpreadsheet, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bulk-orders")({
  head: () => ({
    meta: [
      { title: "Bulk & Wholesale Orders — Nadeem Traders" },
      { name: "description", content: "Submit commercial grocery and spice bulk queries for corporate delivery." }
    ],
  }),
  component: BulkOrdersPage,
});

function BulkOrdersPage() {
  const [form, setForm] = useState({ companyName: "", contactPerson: "", phone: "", itemsQuery: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Bulk order inquiry submitted successfully. Our commercial sales desk will get back to you within 24 hours.");
      setForm({ companyName: "", contactPerson: "", phone: "", itemsQuery: "" });
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
          <FileSpreadsheet className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Bulk Wholesale Orders</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need bags of grain, custom spice blends, or wholesale grocery items for hotels, restaurants, or retail outlets? Let us know.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/30 border border-emerald-900/20 rounded-[32px] p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business / Company Name</label>
            <input
              required
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Person Name</label>
            <input
              required
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Items & Quantities</label>
            <textarea
              required
              rows={4}
              value={form.itemsQuery}
              onChange={(e) => setForm({ ...form, itemsQuery: e.target.value })}
              placeholder="e.g. 50 bags of Guard Rice 50kg, 20 cartons of Dalda Oil 5L..."
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> Submit Inquiry
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
