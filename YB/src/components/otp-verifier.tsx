"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquareText, ShieldCheck, TimerReset } from "lucide-react";

interface OtpVerifierProps {
  purpose: "register" | "login" | "reset";
  mobile: string;
  /** Full POST body to reuse when resending (e.g. includes name/password for register). */
  resendPayload: Record<string, unknown>;
  initialResendIn: number;
  initialDevOtp?: string | null;
  title?: string;
  subtitle?: string;
  onVerified: (data: { ok: boolean; resetToken?: string; user?: { name: string } }) => void;
  onBack: () => void;
}

export function OtpVerifier({
  purpose,
  mobile,
  resendPayload,
  initialResendIn,
  initialDevOtp,
  title = "Verify your number",
  subtitle,
  onVerified,
  onBack,
}: OtpVerifierProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [seconds, setSeconds] = useState(initialResendIn);
  const [devOtp, setDevOtp] = useState<string | null | undefined>(initialDevOtp);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join("");
  const complete = code.length === 6;

  function setDigit(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = v;
      return next;
    });
    setError(null);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "Enter" && complete) void verify();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    setDigits((d) => d.map((_, i) => pasted[i] ?? ""));
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  function failWith(message: string) {
    setError(message);
    setShake(true);
    setDigits(Array(6).fill(""));
    inputsRef.current[0]?.focus();
    setTimeout(() => setShake(false), 500);
  }

  async function verify() {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, mobile, code }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onVerified(data);
      } else {
        failWith(data.error || "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resendPayload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSeconds(data.resendIn ?? 30);
        setDevOtp(data.devOtp ?? null);
        setDigits(Array(6).fill(""));
        inputsRef.current[0]?.focus();
      } else {
        setSeconds(data.retryAfter ?? 0);
        setError(data.error || "Could not resend right now.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-bark/60 transition hover:text-caramel"
      >
        <ArrowLeft className="size-3.5" /> Edit details
      </button>

      <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-cocoa">
        <ShieldCheck className="size-6 text-caramel" /> {title}
      </h2>
      <p className="mt-1.5 text-sm text-bark/70">
        {subtitle ?? (
          <>
            Enter the 6-digit OTP sent to <strong className="text-cocoa">+91 {mobile}</strong>
          </>
        )}
      </p>

      <div className={`mt-6 flex justify-between gap-2 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            className={`otp-box size-11 rounded-xl border bg-ivory text-center font-display text-xl font-bold text-cocoa sm:size-12 ${
              error ? "border-red-400" : "border-cocoa/15"
            }`}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {devOtp && (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/15 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ember">
            <MessageSquareText className="size-4" /> Simulated SMS gateway (demo)
          </p>
          <p className="mt-1 text-sm text-bark">
            No live SMS provider configured — your OTP is{" "}
            <span className="font-display text-lg font-bold tracking-widest text-cocoa">{devOtp}</span>
          </p>
        </div>
      )}

      <button
        onClick={() => void verify()}
        disabled={!complete || busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-cocoa py-3.5 text-sm font-bold text-ivory transition hover:bg-bark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Verify & continue
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <TimerReset className="size-4 text-caramel" />
        {seconds > 0 ? (
          <p className="text-bark/60">
            Resend OTP in{" "}
            <span className="font-bold tabular-nums text-cocoa">0:{String(seconds).padStart(2, "0")}</span>
          </p>
        ) : (
          <button
            onClick={() => void resend()}
            disabled={resending}
            className="font-bold text-caramel underline-offset-2 transition hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        )}
      </div>
    </div>
  );
}
