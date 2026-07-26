import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Truck, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/delivery-info")({
  head: () => ({
    meta: [
      { title: "Delivery Information — Nadeem Traders" },
      { name: "description", content: "Details about shipping rates, wholesale timelines, and delivery areas in Pakistan." }
    ],
  }),
  component: DeliveryInfoPage,
});

function DeliveryInfoPage() {
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

      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <Truck className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-black text-white">Delivery Information</h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Nadeem Traders provides reliable, fast delivery solutions for retail and bulk wholesale orders across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/30 border border-emerald-900/15 rounded-3xl p-5 text-center space-y-3">
            <MapPin className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-bold text-sm text-slate-200">Delivery Areas</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              We dispatch wholesale and retail items directly to all major cities in Punjab, Sindh, KPK, and Balochistan.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-emerald-900/15 rounded-3xl p-5 text-center space-y-3">
            <Clock className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-bold text-sm text-slate-200">Delivery Timelines</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Retail orders take 2-4 business days. Bulk orders are processed from central wholesale hubs and ship in 3-6 business days.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-emerald-900/15 rounded-3xl p-5 text-center space-y-3">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-bold text-sm text-slate-200">Secure Packaging</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All bulk bags (rice, atta, spices) are packed in moisture-resistant bags to maintain freshness during transit.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
import { Clock } from "lucide-react";
