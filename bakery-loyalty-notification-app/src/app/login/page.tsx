"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Croissant, Eye, EyeOff, KeyRound, Smartphone } from "lucide-react";
import { login } from "@/lib/client";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await login(mobile, password);
    setBusy(false);
    if (!res.ok || !res.user) {
      toast.error(res.error ?? "Could not log you in.");
      return;
    }
    toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(res.user.role === "admin" ? "/admin" : next || "/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/hero.jpg" alt="Fresh bakes" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/30 to-espresso/10" />
        <div className="absolute bottom-14 left-12 right-12 text-cream">
          <p className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
            <Croissant size={13} /> The Yummy Club
          </p>
          <h2 className="mt-4 max-w-md font-display text-4xl leading-tight">
            Your punch card missed you, <span className="italic text-caramel">sweet</span>.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-cream/75">
            Log in to check your points, fill the next slot and get a step closer
            to your free bake.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Back to home"><Logo /></Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa/60 transition hover:text-caramel-deep">
              <ArrowLeft size={14} /> Home
            </Link>
          </div>

          <h1 className="mt-12 font-display text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-cocoa/70">
            Sign in with your mobile number to open your dashboard.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/70">
                Mobile number
              </span>
              <span className="flex items-center gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3.5 transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                <Smartphone size={17} className="shrink-0 text-caramel" />
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-cocoa/35"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/70">
                Password
              </span>
              <span className="flex items-center gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3.5 transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                <KeyRound size={17} className="shrink-0 text-caramel" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-cocoa/35"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-cocoa/40 transition hover:text-caramel-deep" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-espresso py-4 text-sm font-extrabold text-cream shadow-warm transition hover:bg-caramel-deep disabled:opacity-60"
            >
              {busy ? "Checking the ledger..." : "Log in"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cocoa/70">
            New here?{" "}
            <Link href="/register" className="font-extrabold text-caramel-deep underline underline-offset-4">
              Join the club
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-sand bg-cream-soft/70 p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cocoa/60">
              Try a demo account
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setMobile("9876543210"); setPassword("yummy123"); }}
                className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-espresso shadow-card transition hover:bg-butter"
              >
                Customer — 10th order demo
              </button>
              <button
                type="button"
                onClick={() => { setMobile("9009009009"); setPassword("owner123"); }}
                className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-espresso shadow-card transition hover:bg-butter"
              >
                Bakery owner (admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
