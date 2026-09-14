"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Croissant, Loader2 } from "lucide-react";
import { OtpVerifier } from "@/components/otp-verifier";

type Mode = "login" | "register";

export function AuthForm({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendPayload, setResendPayload] = useState<Record<string, unknown>>({});
  const [resendIn, setResendIn] = useState(30);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpMobile, setOtpMobile] = useState("");

  const destination = nextUrl && nextUrl.startsWith("/") ? nextUrl : "/dashboard";

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const digits = mobile.replace(/\D/g, "");
    const normalized = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

    if (normalized.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (mode === "register") {
      if (name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    } else if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        purpose: mode,
        mobile: normalized,
        ...(mode === "register" ? { name: name.trim(), password } : { password }),
      };
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResendPayload(payload);
        setResendIn(data.resendIn ?? 30);
        setDevOtp(data.devOtp ?? null);
        setOtpMobile(normalized);
        setStep("otp");
      } else {
        setError(data.error || "Could not send OTP. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-cocoa/10 bg-ivory shadow-soft lg:grid-cols-[1.1fr_1fr]">
        {/* ------------------------------------------------ visual panel */}
        <div className="relative hidden lg:block">
          <Image
            src="/images/cinnamon-rolls.jpg"
            alt="Fresh cinnamon rolls"
            fill
            className="object-cover"
            sizes="40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-cocoa/20 to-transparent" />
          <div className="absolute bottom-0 p-8 text-ivory">
            <p className="font-display text-3xl font-semibold leading-tight">
              Every 5th order, <em className="italic text-gold">a gift.</em>
            </p>
            <p className="mt-2 text-sm text-ivory/80">
              Sign in to track your loyalty circle, QR orders and WhatsApp updates.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------- form panel */}
        <div className="p-7 sm:p-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-caramel text-ivory">
              <Croissant className="size-5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl font-semibold text-cocoa">Yummy Bakes</span>
          </Link>

          {step === "form" ? (
            <>
              <div className="mt-8 grid grid-cols-2 rounded-full border border-cocoa/10 bg-cream p-1 text-sm font-bold">
                {(["login", "register"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`rounded-full py-2.5 transition ${
                      mode === m ? "bg-cocoa text-ivory" : "text-bark/60 hover:text-cocoa"
                    }`}
                  >
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-7 space-y-4">
                {mode === "register" && (
                  <div>
                    <label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                      Full name
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Asha Rao"
                      className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="mobile" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                    Mobile number
                  </label>
                  <div className="mt-1.5 flex overflow-hidden rounded-xl border border-cocoa/15 bg-ivory transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                    <span className="grid place-items-center border-r border-cocoa/10 bg-cream px-3.5 text-sm font-bold text-bark/70">
                      +91
                    </span>
                    <input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      inputMode="numeric"
                      className="w-full px-4 py-3 text-sm text-cocoa outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"}
                    className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                  />
                  {mode === "login" && (
                    <div className="mt-1.5 text-right">
                      <Link
                        href="/auth/forgot"
                        className="text-xs font-bold text-caramel transition hover:text-ember hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </div>

                {mode === "register" && (
                  <div>
                    <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                      Confirm password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                    />
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-cocoa py-3.5 text-sm font-bold text-ivory transition hover:bg-bark disabled:opacity-50"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {mode === "login" ? "Send login OTP" : "Send verification OTP"}
                </button>

                <p className="text-center text-xs leading-relaxed text-bark/50">
                  We verify every {mode === "login" ? "login" : "registration"} with a
                  one-time password sent to your mobile.
                </p>
              </form>
            </>
          ) : (
            <div className="mt-10">
              <OtpVerifier
                purpose={mode}
                mobile={otpMobile}
                resendPayload={resendPayload}
                initialResendIn={resendIn}
                initialDevOtp={devOtp}
                onVerified={() => {
                  router.replace(destination);
                  router.refresh();
                }}
                onBack={() => {
                  setStep("form");
                  setError(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
