import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Leaf, ArrowLeft, Loader2, ShieldCheck, ShoppingBag, 
  Clock, Sparkles, Check, ChevronRight, Lock, Mail, Key 
} from "lucide-react";
import { 
  loginWithGoogleCredential, sendVerificationEmail, verifyEmailCodeAndLogin 
} from "../lib/actions";
import { toast } from "sonner";
import galaMandiHeroImg from "@/assets/gala_mandi_hero.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Nadeem Traders" },
      { name: "description", content: "Sign in with your Google account or email verification to track orders and checkout." }
    ],
  }),
  component: LoginPage,
});

function getBrowserName() {
  if (typeof window === "undefined") return "Server";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Browser";
}

function getOSName() {
  if (typeof window === "undefined") return "Server";
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "OS";
}

function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    // If user is already logged in, redirect them
    if (typeof window !== "undefined") {
      const activeUser = sessionStorage.getItem("nadeem_user");
      if (activeUser) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") || "/dashboard";
        window.location.href = redirect;
        return;
      }

      // Check mode query param
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "signup") {
        setIsSignUp(true);
      }
    }

    // Define callback in window
    (window as any).handleGoogleCredentialResponse = async (response: any) => {
      setIsLoggingIn(true);
      try {
        const guestSessionId = typeof window !== "undefined" ? sessionStorage.getItem("nadeem_guest_session_id") || undefined : undefined;
        
        const res = await loginWithGoogleCredential({
          data: {
            credential: response.credential,
            guestSessionId,
            deviceInfo: typeof window !== "undefined" ? navigator.userAgent : undefined,
            browser: getBrowserName(),
            os: getOSName(),
          }
        });

        if (res.success) {
          toast.success("Successfully logged in!");
          sessionStorage.setItem("nadeem_user", JSON.stringify(res.user));
          if (guestSessionId) {
            sessionStorage.removeItem("nadeem_guest_session_id");
          }
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect") || "/dashboard";
          window.location.href = redirect;
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Google Authentication failed. Please try again.");
      } finally {
        setIsLoggingIn(false);
      }
    };
  }, []);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const renderGoogleBtn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: (window as any).handleGoogleCredentialResponse,
        });
        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            { theme: "filled_blue", size: "large", width: 320, shape: "pill" }
          );
        }
        if (checkInterval) clearInterval(checkInterval);
      }
    };

    renderGoogleBtn();

    // If script hasn't loaded yet, poll for it
    if (typeof window !== "undefined" && !(window as any).google) {
      checkInterval = setInterval(renderGoogleBtn, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isLoggingIn, showOtpScreen]);

  // Request OTP code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (isSignUp && !username.trim()) {
      toast.error("Please enter a username.");
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await sendVerificationEmail({ data: { email } });
      if (res.success) {
        toast.success("Verification code sent to your email!");
        if (res.warning) {
          toast.warning(res.warning, { duration: 10000 });
        }
        setShowOtpScreen(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const guestSessionId = typeof window !== "undefined" ? sessionStorage.getItem("nadeem_guest_session_id") || undefined : undefined;
      const res = await verifyEmailCodeAndLogin({
        data: {
          email,
          code: otpCode,
          username: isSignUp ? username : undefined,
          guestSessionId,
          deviceInfo: typeof window !== "undefined" ? navigator.userAgent : undefined,
          browser: getBrowserName(),
          os: getOSName()
        }
      });

      if (res.success) {
        toast.success(isSignUp ? "Account created and verified successfully!" : "Successfully verified and signed in!");
        sessionStorage.setItem("nadeem_user", JSON.stringify(res.user));
        if (guestSessionId) {
          sessionStorage.removeItem("nadeem_guest_session_id");
        }
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") || "/dashboard";
        window.location.href = redirect;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* LEFT SECTION: Branding & Hero (50% desktop, hidden/below on mobile) */}
      <section className="relative w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex flex-col justify-between p-8 md:p-12 text-white order-2 md:order-1 overflow-hidden">
        {/* Overlay Dark Green */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20]/90 to-[#2E7D32]/85 z-10" />
        
        {/* Full-height Background with zoom effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105 ease-out" 
          style={{ backgroundImage: `url(${galaMandiHeroImg})` }}
        />

        {/* Top Branding logo */}
        <div className="relative z-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-soft overflow-hidden">
              <img src="/LOGO.png" alt="Nadeem Traders" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight text-left">
              <div className="text-lg font-black tracking-tight text-white">Nadeem<span className="text-emerald-300">Traders</span></div>
              <div className="text-[9px] uppercase tracking-widest text-emerald-100 font-bold">Wholesale & Retail Store</div>
            </div>
          </Link>
        </div>

        {/* Hero Copy */}
        <div className="relative z-20 my-auto py-10 space-y-6 md:space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-white">
              Fresh From Pakistan's Finest Suppliers
            </h1>
            <p className="text-xs md:text-sm text-emerald-50 max-w-lg leading-relaxed font-medium">
              Buy premium fruits, vegetables, spices, grains, and grocery essentials directly from trusted suppliers.
            </p>
          </div>

          {/* Features cards */}
          <div className="space-y-3.5 max-w-md">
            {[
              { icon: "🌿", title: "Farm Fresh Products", desc: "Directly sourced from Punjab and Sindh orchards and fields." },
              { icon: "🚚", title: "Fast Delivery Across Pakistan", desc: "Sameday or nextday logistics to major retail centers." },
              { icon: "🔒", title: "Secure Shopping & Payments", desc: "Safe Google OAuth authentication & COD verification." }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="group flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-soft hover:-translate-y-0.5 hover:bg-white/10 transition duration-300 hover:border-emerald-300/30"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-200/80 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-20 text-[10px] text-emerald-100/70 text-left">
          Trusted by thousands of customers across Pakistan.
        </div>
      </section>

      {/* RIGHT SECTION: Login & Account Creation Form (50% desktop, first on mobile) */}
      <main className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 order-1 md:order-2 bg-gradient-to-tr from-[#E8F5E9]/20 via-[#F8FAF8] to-[#E8F5E9]/40 min-h-[60vh] md:min-h-screen">
        
        {/* Floating white glassmorphism card */}
        <div className="w-full max-w-[450px] bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[28px] p-6 sm:p-8 shadow-2xl flex flex-col transition-all duration-300">
          
          {/* Header */}
          <div className="text-center md:text-left space-y-1.5 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
              {showOtpScreen 
                ? "Verify Email" 
                : isSignUp 
                  ? "Create Account" 
                  : "Welcome Back"
              }
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {showOtpScreen
                ? `Enter the 6-digit verification code sent to ${email}.`
                : isSignUp 
                  ? "Sign up to start shopping fresh products from our wholesale catalog." 
                  : "Sign in to continue shopping fresh products from our wholesale catalog."
              }
            </p>
          </div>

          {/* GSI Login Area (Hidden during OTP entry) */}
          {!showOtpScreen && (
            <div className="w-full flex flex-col items-center gap-4">
              {isLoggingIn ? (
                <div className="flex flex-col items-center justify-center py-4 w-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
                  <span className="text-[11px] text-slate-500 mt-2 font-bold animate-pulse">Verifying secure Google session...</span>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="relative w-full max-w-xs flex justify-center h-[46px] transition hover:shadow-soft duration-200" 
                    id="google-signin-btn"
                  >
                    {/* Google Button renders here */}
                  </div>
                </div>
              )}

              <div className="relative my-3 w-full flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">
                  OR
                </span>
              </div>
            </div>
          )}

          {/* STAGE 2: Verification Code Form */}
          {showOtpScreen ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5 text-left">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Key className="h-3 w-3 text-[#2E7D32]" /> Verification OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-center text-lg font-bold tracking-[8px] text-slate-800 outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/5 transition duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] py-3.5 text-xs font-black text-white shadow-soft hover:shadow-glow disabled:opacity-50 hover:-translate-y-0.5 transition duration-200"
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify & Access Store
              </button>

              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <button 
                  type="button" 
                  onClick={() => setShowOtpScreen(false)}
                  className="hover:text-slate-600 flex items-center gap-0.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button 
                  type="button" 
                  onClick={handleRequestOtp}
                  disabled={isSendingCode}
                  className="text-[#2E7D32] hover:text-[#1B5E20] disabled:opacity-50"
                >
                  {isSendingCode ? "Resending..." : "Resend Code"}
                </button>
              </div>
            </form>
          ) : (
            /* STAGE 1: Email & Username Registration / Sign In Form */
            <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
              
              {/* Show Username extra field ONLY during Account Creation */}
              {isSignUp && (
                <div className="animate-fade-in duration-300">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. nadeem_store"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/5 transition duration-200"
                  />
                </div>
              )}

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-[#2E7D32]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/5 transition duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] py-3.5 text-xs font-black text-white shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition duration-200 disabled:opacity-50"
              >
                {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSignUp ? "Register & Verify Email" : "Sign In & Verify Email"}
              </button>
            </form>
          )}

          {/* Switch Sign In / Signup mode (Hidden during OTP entry) */}
          {!showOtpScreen && (
            <div className="text-center mt-6 text-xs font-bold text-slate-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#2E7D32] hover:text-[#1B5E20] transition inline-flex items-center gap-0.5 font-black hover:translate-x-0.5 transform duration-200 focus:outline-none"
              >
                {isSignUp ? "Sign In" : "Create Account"} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#2E7D32]" /> Secure OTP Login</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2E7D32]" /> Google Protected Authentication</span>
            <span className="text-[9px] text-slate-400/80 font-medium">Your connection is fully encrypted with SSL</span>
          </div>

        </div>
      </main>

    </div>
  );
}
