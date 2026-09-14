"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Copy,
  Croissant,
  Gift,
  Loader2,
  MapPin,
  QrCode,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { UserSession } from "@/lib/session";
import { CYCLE_LENGTH, DELIVERY_SLOTS, inr } from "@/lib/utils";

type Step = "details" | "pay" | "done";

interface PlacedOrder {
  id: number;
  ref: string;
  total: number;
  upiUri: string;
  qr: string;
}

interface VerifyResult {
  paymentRef: string;
  loyalty: {
    points: number;
    cycleCount: number;
    milestone: boolean;
    rewardTitle?: string;
  };
  message: string;
}

export function CheckoutClient({ session }: { session: UserSession }) {
  const { lines, total, clear } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState(session.mobile);
  const [slot, setSlot] = useState(DELIVERY_SLOTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const digits = contact.replace(/\D/g, "");
    const normalized = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (normalized.length !== 10) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }
    if (mode === "delivery" && address.trim().length < 10) {
      setError("Please enter your complete delivery address.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
          delivery: {
            mode,
            address: mode === "delivery" ? address.trim() : undefined,
            contact: normalized,
            slot,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setOrder(data.order);
        setStep("pay");
      } else {
        setError(data.error || "Could not place the order.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPayment() {
    if (!order || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnRef: txnRef.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          paymentRef: data.paymentRef ?? "verified",
          loyalty: data.loyalty,
          message: data.message,
        });
        clear();
        setStep("done");
        router.refresh();
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUpi() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.upiUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-caramel text-ivory">
              <Croissant className="size-4.5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-semibold text-cocoa">Yummy Bakes</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-cocoa/15 px-4 py-2 text-xs font-bold text-cocoa transition hover:border-caramel hover:text-caramel"
          >
            {session.name.split(" ")[0]}&apos;s dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* step indicator */}
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
          {["Details", "Pay by QR", "Confirmed"].map((s, i) => {
            const active =
              (step === "details" && i === 0) || (step === "pay" && i === 1) || (step === "done" && i === 2);
            const past = (step === "pay" && i === 0) || (step === "done" && i < 2);
            return (
              <div key={s} className="flex items-center gap-3">
                <span
                  className={`grid size-7 place-items-center rounded-full border ${
                    active
                      ? "border-caramel bg-caramel text-ivory"
                      : past
                        ? "border-moss bg-moss text-ivory"
                        : "border-cocoa/20 text-bark/50"
                  }`}
                >
                  {past ? <CheckCircle2 className="size-4" /> : i + 1}
                </span>
                <span className={active ? "text-cocoa" : "text-bark/50"}>{s}</span>
                {i < 2 && <span className="h-px w-8 bg-cocoa/15" />}
              </div>
            );
          })}
        </div>

        {step === "details" && (
          <>
            {lines.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-cocoa/20 bg-ivory px-6 py-16 text-center">
                <ShoppingBag className="mx-auto size-10 text-blush" />
                <p className="mt-4 font-display text-xl font-semibold text-cocoa">
                  Your basket is empty
                </p>
                <Link
                  href="/#menu"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-caramel px-6 py-3 text-sm font-bold text-ivory transition hover:bg-ember"
                >
                  <ArrowLeft className="size-4" /> Back to the bake list
                </Link>
              </div>
            ) : (
              <form onSubmit={placeOrder} className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* delivery details */}
                <section className="rounded-3xl border border-cocoa/10 bg-ivory p-6 shadow-lift sm:p-8">
                  <h2 className="font-display text-xl font-semibold text-cocoa">
                    Delivery details
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: "delivery", label: "Door delivery", icon: Truck },
                        { id: "pickup", label: "Store pickup", icon: Store },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setMode(o.id)}
                        className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-bold transition ${
                          mode === o.id
                            ? "border-caramel bg-caramel/10 text-ember"
                            : "border-cocoa/15 text-bark/60 hover:border-cocoa/30"
                        }`}
                      >
                        <o.icon className="size-4" /> {o.label}
                      </button>
                    ))}
                  </div>

                  {mode === "delivery" && (
                    <div className="mt-5">
                      <label htmlFor="address" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-bark/60">
                        <MapPin className="size-3.5 text-caramel" /> Delivery address
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        placeholder="Flat, street, landmark…"
                        className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                      />
                    </div>
                  )}

                  <div className="mt-5">
                    <label htmlFor="contact" className="text-xs font-bold uppercase tracking-wide text-bark/60">
                      Contact number (for WhatsApp updates)
                    </label>
                    <div className="mt-1.5 flex overflow-hidden rounded-xl border border-cocoa/15 bg-ivory transition focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/15">
                      <span className="grid place-items-center border-r border-cocoa/10 bg-cream px-3.5 text-sm font-bold text-bark/70">
                        +91
                      </span>
                      <input
                        id="contact"
                        value={contact}
                        onChange={(e) => setContact(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                        inputMode="numeric"
                        className="w-full px-4 py-3 text-sm text-cocoa outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="slot" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-bark/60">
                      <Clock3 className="size-3.5 text-caramel" />
                      {mode === "pickup" ? "Pickup slot" : "Delivery slot"}
                    </label>
                    <select
                      id="slot"
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-cocoa/15 bg-ivory px-4 py-3 text-sm text-cocoa outline-none transition focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                    >
                      {DELIVERY_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                      {error}
                    </p>
                  )}
                </section>

                {/* order summary */}
                <section className="h-fit rounded-3xl bg-cocoa p-6 text-cream shadow-soft sm:p-7">
                  <h2 className="font-display text-xl font-semibold">Order summary</h2>
                  <ul className="mt-4 space-y-3">
                    {lines.map(({ product, qty }) => (
                      <li key={product.id} className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{product.name}</p>
                          <p className="text-xs text-cream/60">× {qty}</p>
                        </div>
                        <p className="text-sm font-bold">{inr(product.price * qty)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 border-t border-dashed border-cream/20 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-cream/70">Bill total</p>
                      <p className="font-display text-3xl font-bold text-gold">{inr(total)}</p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-cream/50">
                      A dynamic QR for exactly {inr(total)} will be generated next.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-extrabold text-cocoa transition hover:bg-cream disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                    Place order & generate QR
                  </button>
                </section>
              </form>
            )}
          </>
        )}

        {step === "pay" && order && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-cocoa/10 bg-ivory p-6 text-center shadow-lift sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-caramel">
                Scan with any UPI app
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-cocoa">
                Pay exactly {inr(order.total)}
              </h2>
              <div className="mx-auto mt-5 w-fit rounded-3xl border border-cocoa/10 bg-[#fffaf1] p-4 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.qr} alt={`Payment QR for ${order.ref}`} className="size-60 sm:size-72" />
              </div>
              <p className="mt-3 text-xs font-bold text-bark/60">
                Order {order.ref} · yummybakes@okhdfcbank
              </p>
              <button
                onClick={() => void copyUpi()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cocoa/15 px-4 py-2 text-xs font-bold text-cocoa transition hover:border-caramel hover:text-caramel"
              >
                <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy UPI link"}
              </button>
            </section>

            <section className="flex flex-col rounded-3xl bg-cocoa p-6 text-cream shadow-soft sm:p-8">
              <h2 className="font-display text-2xl font-semibold">Confirm payment</h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-cream/80">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-extrabold text-gold">1</span>
                  Scan the QR with GPay / PhonePe / Paytm and pay {inr(order.total)}.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-extrabold text-gold">2</span>
                  Paste the UPI transaction / UTR number below (optional in demo).
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-extrabold text-gold">3</span>
                  Tap verify — loyalty points credit only after verification.
                </li>
              </ol>

              <div className="mt-6">
                <label htmlFor="txn" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                  UPI transaction reference (UTR)
                </label>
                <input
                  id="txn"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. 407612345678"
                  className="mt-1.5 w-full rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 text-sm text-cream placeholder:text-cream/40 outline-none transition focus:border-gold"
                />
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
                  {error}
                </p>
              )}

              <button
                onClick={() => void verifyPayment()}
                disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-extrabold text-cocoa transition hover:bg-cream disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                I have paid — verify payment
              </button>
              <p className="mt-3 text-center text-[11px] text-cream/50">
                Unverified orders earn no loyalty points.
              </p>
            </section>
          </div>
        )}

        {step === "done" && order && result && (
          <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-cocoa/10 bg-ivory p-8 text-center shadow-soft">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-moss/15">
              <CheckCircle2 className="size-8 text-moss" />
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-cocoa">
              Order {order.ref} confirmed!
            </h2>
            <p className="mt-2 text-sm text-bark/70">
              Payment verified ({result.paymentRef}). A full order summary with delivery
              details has been sent to your WhatsApp.
            </p>

            {result.loyalty.milestone ? (
              <div className="mt-6 rounded-2xl border border-gold/50 bg-gold/15 px-5 py-4">
                <p className="flex items-center justify-center gap-2 font-display text-xl font-bold text-ember">
                  <Gift className="size-5" /> 5th-order milestone!
                </p>
                <p className="mt-1 text-sm text-bark/80">
                  {result.loyalty.rewardTitle} unlocked — and the owner has been alerted on
                  WhatsApp. Your cycle counter has reset to start a fresh circle.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-cream px-5 py-4">
                <p className="text-sm font-bold text-cocoa">+1 loyalty point credited</p>
                <p className="mt-1 text-xs text-bark/60">
                  Cycle progress: {result.loyalty.cycleCount}/{CYCLE_LENGTH} · Lifetime points:{" "}
                  {result.loyalty.points}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-cocoa px-6 py-3 text-sm font-bold text-ivory transition hover:bg-bark"
              >
                View my dashboard
              </Link>
              <Link
                href="/#menu"
                className="rounded-full border border-cocoa/15 px-6 py-3 text-sm font-bold text-cocoa transition hover:border-caramel hover:text-caramel"
              >
                Order more
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
