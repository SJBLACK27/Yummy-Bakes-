"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Gift, KeyRound, Smartphone, User } from "lucide-react";
import { register as registerUser } from "@/lib/client";
import { Logo } from "@/components/Logo";
import { PunchCard } from "@/components/PunchCard";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await registerUser(name, mobile, password);
    setBusy(false);
    if (!res.ok || !res.user) {
      toast.error(res.error ?? "Could not create your account.");
      return;
    }
    toast.success("Welcome to the Yummy Club! Your punch card is ready.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden bg-espresso lg:block">
        <Image src="/images/menu/cinnamon-rolls.jpg" alt="Cinnamon rolls" fill priority className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/40 to-espresso/30" />
        <div className="absolute inset-x-10 bottom-12 text-cream">
          <p className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
            <Gift size={13} /> Free bake on every 10th order
          </p>
          <div className="mt-6 max-w-sm rounded-3xl border border-cream/15 bg-cream/10 p-6 backdrop-blur-xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-butter">Your new punch card</p>
            <div className="mt-4">
              <PunchCard filled={0} pulse dark />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-cream/70">
              Every order earns points and fills a slot. Fill all ten and the next
              bake is completely on the house.
            </p>
          </div>
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

          <h1 className="mt-12 font-display text-4xl">Join the Yummy Club</h1>
          <p className="mt-2 text-sm text-cocoa/70">
            Your mobile number doubles as your loyalty card. 30 seconds, done.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/70">Full name</span>
              <span className="flex items-center gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3.5 transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                <User size={17} className="shrink-0 text-caramel" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Mehta"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-cocoa/35"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/70">Mobile number</span>
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
              <span className="mt-1.5 block text-[11px] font-semibold text-cocoa/50">
                Orders and rewards are tracked against this number.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/70">Create password</span>
              <span className="flex items-center gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3.5 transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                <KeyRound size={17} className="shrink-0 text-caramel" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
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
              {busy ? "Preheating your account..." : "Create my account"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cocoa/70">
            Already baking with us?{" "}
            <Link href="/login" className="font-extrabold text-caramel-deep underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
