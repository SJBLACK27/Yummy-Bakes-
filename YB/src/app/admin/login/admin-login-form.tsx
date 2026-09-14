"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole, ShieldAlert } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError(data.error || "Invalid admin credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-cocoa lg:grid-cols-2">
      {/* visual half */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/sourdough.jpg"
          alt="Fresh sourdough"
          fill
          priority
          className="object-cover opacity-70"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa/40 to-cocoa" />
        <div className="absolute bottom-12 left-12 max-w-sm text-cream">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Owner console</p>
          <p className="mt-3 font-display text-4xl font-semibold leading-tight">
            The back of the bakery.
          </p>
          <p className="mt-3 text-sm text-cream/70">
            POS entries, loyalty cycles, gateway logs — restricted to the Yummy Bakes owner.
          </p>
        </div>
      </div>

      {/* form half */}
      <div className="flex items-center justify-center px-6 py-12">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-[2rem] border border-cream/15 bg-bark/40 p-8 backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-gold/15">
              <LockKeyhole className="size-5 text-gold" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-cream">Admin access</h1>
              <p className="text-xs text-cream/50">Yummy Bakes · Restricted area</p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="admin-user" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                Username
              </label>
              <input
                id="admin-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1.5 w-full rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 text-sm text-cream placeholder:text-cream/40 outline-none transition focus:border-gold"
                placeholder="Admin username"
              />
            </div>
            <div>
              <label htmlFor="admin-pass" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 text-sm text-cream placeholder:text-cream/40 outline-none transition focus:border-gold"
                placeholder="Admin password"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-extrabold text-cocoa transition hover:bg-cream disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Enter dashboard
          </button>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-cream/40">
            This console is not linked from the public site. All access is logged.
          </p>
        </form>
      </div>
    </main>
  );
}
