import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Nadeem Traders" },
      { name: "description", content: "Reach out to Nadeem Traders for wholesale deliveries and inquiries." }
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Thank you! Your message has been received. We will contact you back shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
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

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-white">Contact Us</h1>
            <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
              Have questions about bulk shipping across Pakistan, commercial pricing, or account registration? Reach out to our team directly.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-950 text-primary border border-emerald-900/30">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Main Warehouse Office</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Commercial Trade Hub, Sector G, Lahore, Punjab, Pakistan.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-950 text-primary border border-emerald-900/30">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Phone Support</h4>
                <p className="text-xs text-slate-400 mt-1">+92 (042) 3578-9900 • +92 (300) 123-4567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-950 text-primary border border-emerald-900/30">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Email Inquiry</h4>
                <p className="text-xs text-slate-400 mt-1">support@nadeemtraders.com • sales@nadeemtraders.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="bg-slate-900/30 border border-emerald-900/20 rounded-[32px] p-6 md:p-8 space-y-4">
          <h3 className="font-extrabold text-lg text-white">Send Message</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
            <input
              required
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message Details</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-emerald-900/30 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> Send Message
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
