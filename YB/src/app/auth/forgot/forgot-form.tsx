"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Croissant, KeyRound, Loader2 } from "lucide-react";
import { OtpVerifier } from "@/components/otp-verifier";

type Step = "mobile" | "otp" | "password" | "done";

export function ForgotForm() {
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const digits = mobile.replace(/\D/g, "");
    const normalized = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (normalized.length !== 10) {
      setError("Enter a valid 10-digit registered mobile number.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "reset", mobile: normalized }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMobile(normalized);
        setResendIn(data.resendIn ?? 30);
        setDevOtp(data.devOtp ?? null);
        setStep("otp");
      } else {
        setError(data.error || "Could not send recovery OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match. Please re-enter both fields.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStep("done");
      } else {
        setError(data.error || "Could not update password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-cocoa/10 bg-ivory p-7 shadow-soft sm:p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-caramel text-ivory">
            <Croissant className="size-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl font-semibold text-cocoa">Yummy Bakes</span>
        </Link>

        {step === "mobile" && (
          <>
            <h1 className="mt-8 flex items-center gap-2 font-display text-2xl font-semibold text-cocoa">
              <KeyRound className="size-6 text-caramel" /> Recover access
            </h1>
            <p className="mt-1.5 text-sm text-bark/70">
              Enter your registered mobile number — we&apos;ll send a recovery OTP.
            </p>
            <form onSubmit={sendOtp} className="mt-6 space-y-4">
              <div>
                <label htmlFor="mobile" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                  Registered mobile number
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
                Send recovery OTP
              </button>
              <p className="text-center text-xs text-bark/50">
                Remembered it?{" "}
                <Link href="/auth" className="font-bold text-caramel hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}

        {step === "otp" && (
          <div className="mt-8">
            <OtpVerifier
              purpose="reset"
              mobile={mobile}
              resendPayload={{ purpose: "reset", mobile }}
              initialResendIn={resendIn}
              initialDevOtp={devOtp}
              title="Verify recovery OTP"
              onVerified={(data) => {
                if (data.resetToken) {
                  setResetToken(data.resetToken);
                  setError(null);
                  setStep("password");
                }
              }}
              onBack={() => setStep("mobile")}
            />
          </div>
        )}

        {step === "password" && (
          <>
            <h1 className="mt-8 font-display text-2xl font-semibold text-cocoa">
              Set a new password
            </h1>
            <p className="mt-1.5 text-sm text-bark/70">
              Choose a fresh password for <strong className="text-cocoa">+91 {mobile}</strong>.
              This overwrites your old credentials.
            </p>
            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat the new password"
                  className={`mt-1.5 w-full rounded-xl border bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:ring-4 ${
                    confirm && confirm !== password
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-cocoa/15 focus:border-caramel focus:ring-caramel/15"
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">
                    Passwords do not match.
                  </p>
                )}
              </div>

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
                Update password
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="mt-8 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-moss/15">
              <CheckCircle2 className="size-7 text-moss" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-cocoa">
              Password updated
            </h1>
            <p className="mt-1.5 text-sm text-bark/70">
              Your credentials were overwritten in our records. Sign in with your new password.
            </p>
            <Link
              href="/auth"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-cocoa py-3.5 text-sm font-bold text-ivory transition hover:bg-bark"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
