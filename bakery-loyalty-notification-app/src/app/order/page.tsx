"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  Minus,
  PartyPopper,
  Plus,
  ShoppingBag,
  Sparkles,
  Sticker,
} from "lucide-react";
import clsx from "clsx";
import { fetchMe, post, type ClientReward, type SessionUser } from "@/lib/client";
import { AppHeader, LoadingScreen } from "@/components/AppHeader";
import { MENU, POINTS_PER_ORDER } from "@/lib/menu";
import { inr } from "@/lib/format";

type OrderResult = {
  order: { id: string; purchaseNumber: number; totalAmount: number };
  reward: ClientReward | null;
  whatsapp: "sent" | "simulated" | "failed" | null;
  pointsBalance: number;
  pointsEarned: number;
  progress: number;
};

const SPRINKLE_COLORS = ["#c67b33", "#9d5a1d", "#c9494b", "#57724d", "#e6d2b1", "#f2e3c6", "#55361f"];

function Sprinkles({ count = 30 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length],
        duration: 2.6 + Math.random() * 2.4,
        delay: Math.random() * 1.4,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="sprinkle"
          style={{
            left: b.left,
            backgroundColor: b.color,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationIterationCount: 2,
          }}
        />
      ))}
    </div>
  );
}

export default function OrderPage() {
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user) {
        router.replace("/login?next=/order");
        return;
      }
      setMe(user);
      setLoading(false);
    });
  }, [router]);

  const lines = useMemo(
    () =>
      MENU.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => ({
        ...m,
        qty: cart[m.id],
        line: m.price * cart[m.id],
      })),
    [cart]
  );
  const total = lines.reduce((s, l) => s + l.line, 0);
  const pointsPreview = lines.length > 0 ? POINTS_PER_ORDER : 0;
  const totalOrders = me?.totalOrders ?? 0;
  const currentProgress = totalOrders % 10;
  const previewProgress = (totalOrders + 1) % 10;
  const hitsMilestone = totalOrders > 0 && (totalOrders + 1) % 10 === 0;

  function bump(id: string, delta: number) {
    setCart((c) => {
      const next = Math.max(0, Math.min(20, (c[id] ?? 0) + delta));
      const copy = { ...c, [id]: next };
      if (next === 0) delete copy[id];
      return copy;
    });
  }

  async function placeOrder() {
    if (lines.length === 0) {
      toast.error("Add at least one bake to your basket.");
      return;
    }
    setPlacing(true);
    const res = await post<OrderResult>("/api/orders", {
      items: lines.map((l) => ({ id: l.id, qty: l.qty })),
      note,
    });
    setPlacing(false);
    if (!res.ok || !res.order) {
      toast.error(res.error ?? "Could not place your order.");
      return;
    }
    setResult({
      order: res.order,
      reward: res.reward ?? null,
      whatsapp: res.whatsapp ?? null,
      pointsBalance: res.pointsBalance,
      pointsEarned: res.pointsEarned,
      progress: res.progress,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading || !me) return <LoadingScreen />;

  /* --------------------------- Success screen --------------------------- */
  if (result) {
    const milestone = Boolean(result.reward);
    return (
      <div className="min-h-screen bg-cream">
        {milestone && <Sprinkles />}
        <AppHeader
          me={{ ...me, ...result }}
          active="/order"
          items={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/order", label: "Order Bakes" },
          ]}
        />
        <main className="mx-auto max-w-2xl px-5 py-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[36px] border border-sand/70 bg-white/80 p-8 text-center shadow-warm sm:p-12"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-butter/70 blur-3xl" />

            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
              className={clsx(
                "mx-auto grid h-20 w-20 place-items-center rounded-3xl text-cream shadow-warm",
                milestone ? "bg-gradient-to-br from-caramel to-caramel-deep" : "bg-gradient-to-br from-leaf to-[#404f38]"
              )}
            >
              {milestone ? <PartyPopper size={34} /> : <CheckCircle2 size={34} />}
            </motion.span>

            <h1 className="mt-7 font-display text-4xl sm:text-5xl">
              {milestone ? (
                <>
                  10th order! <span className="italic text-caramel-deep">You did it</span>
                </>
              ) : (
                <>
                  Order <span className="italic text-caramel-deep">confirmed</span>
                </>
              )}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cocoa/75">
              {milestone
                ? "Your punch card is complete — a FREE signature bake is now sitting pretty in your rewards wallet."
                : "We're already preheating the oven. Your points were credited instantly to your account."}
            </p>

            {/* Stats strip */}
            <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                { label: "Points earned", value: `+${result.pointsEarned}` },
                { label: "Balance", value: result.pointsBalance.toLocaleString("en-IN") },
                { label: "Order no.", value: `#${result.order.purchaseNumber}` },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-cream-soft px-3 py-4">
                  <p className="font-display text-2xl">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cocoa/55">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Milestone reward card */}
            {milestone && result.reward && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-7 rounded-3xl bg-gradient-to-br from-caramel to-caramel-deep p-[2px] shadow-warm"
              >
                <div className="rounded-[22px] bg-cream p-6 text-left">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-espresso text-butter">
                      <Gift size={22} />
                    </span>
                    <div>
                      <p className="font-display text-xl">FREE Signature Bake of Choice</p>
                      <p className="text-xs font-semibold text-cocoa/60">
                        Any item from the menu — on the house, freshly baked for you.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream-soft px-4 py-3">
                    <Sparkles size={15} className="shrink-0 text-caramel-deep" />
                    <p className="text-[12px] font-bold text-cocoa/80">
                      Owner notified on WhatsApp
                      {result.whatsapp === "sent" && " (delivered via Twilio)"}
                      {result.whatsapp === "simulated" && " (simulated — see admin log)"}
                      {result.whatsapp === "failed" && " (delivery failed — see admin log)"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!milestone && (
              <p className="mt-7 rounded-2xl bg-butter/50 px-5 py-3 text-[13px] font-bold text-caramel-deep">
                {10 - result.progress === 10 ? 10 : 10 - result.progress} more order{10 - result.progress === 1 ? "" : "s"} to your next FREE bake
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-espresso px-7 py-3.5 text-sm font-extrabold text-cream transition hover:bg-caramel-deep"
              >
                View my dashboard
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => { setResult(null); setCart({}); setNote(""); window.location.reload(); }}
                className="rounded-full border-2 border-espresso/15 px-7 py-3.5 text-sm font-bold text-espresso transition hover:border-caramel hover:bg-butter/50"
              >
                Order another treat
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ---------------------------- Ordering view --------------------------- */
  return (
    <div className="min-h-screen bg-cream">
      <AppHeader
        me={me}
        active="/order"
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/order", label: "Order Bakes" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl">
              What shall we <span className="italic text-caramel-deep">bake</span> for you?
            </h1>
            <p className="mt-2 text-sm font-semibold text-cocoa/60">
              Every order earns points and fills your punch card — you&apos;re at {currentProgress}/10.
            </p>
          </div>
          {hitsMilestone && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="animate-jam inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-caramel to-caramel-deep px-5 py-2.5 text-xs font-extrabold text-cream shadow-warm"
            >
              <PartyPopper size={15} />
              This order is your 10th — FREE bake incoming!
            </motion.div>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Menu */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {MENU.map((m, i) => {
              const qty = cart[m.id] ?? 0;
              return (
                <motion.article
                  key={m.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.55, delay: (i % 2) * 0.07 }}
                  className={clsx(
                    "group overflow-hidden rounded-3xl border bg-white/70 shadow-card transition-all duration-300",
                    qty > 0 ? "border-caramel/70 ring-4 ring-caramel/15" : "border-sand/60"
                  )}
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={m.image}
                      alt={m.name}
                      width={640}
                      height={480}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-caramel-deep backdrop-blur">
                      {m.tag}
                    </span>
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-caramel to-caramel-deep text-sm font-extrabold text-cream shadow-warm"
                        >
                          {qty}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg leading-snug">{m.name}</h3>
                        <span className="mt-1 inline-block rounded-full bg-leaf/10 px-2.5 py-0.5 text-[11px] font-extrabold text-leaf">
                          +1 stamp per order
                        </span>
                      </div>
                      <span className="font-display text-xl">{inr(m.price)}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {qty === 0 ? (
                        <button
                          onClick={() => bump(m.id, 1)}
                          className="inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2.5 text-xs font-extrabold text-cream transition hover:bg-caramel-deep"
                        >
                          <ShoppingBag size={14} /> Add to basket
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 rounded-full border border-sand bg-cream-soft p-1.5">
                          <button
                            onClick={() => bump(m.id, -1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-espresso shadow-card transition hover:bg-espresso hover:text-cream"
                            aria-label={`Remove one ${m.name}`}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-5 text-center text-sm font-extrabold">{qty}</span>
                          <button
                            onClick={() => bump(m.id, 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-espresso text-cream shadow-card transition hover:bg-caramel-deep"
                            aria-label={`Add one ${m.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      )}
                      <span className="text-[12px] font-bold text-cocoa/50">
                        {qty > 0 ? inr(m.price * qty) : m.desc.split(",")[0]}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Basket */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-[32px] border border-sand/70 bg-white/80 p-7 shadow-warm"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Your basket</h2>
                <span className="rounded-full bg-butter/70 px-3.5 py-1 text-xs font-extrabold text-caramel-deep">
                  {lines.reduce((s, l) => s + l.qty, 0)} item{lines.reduce((s, l) => s + l.qty, 0) === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {lines.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-sand bg-cream-soft/70 p-6 text-center">
                    <Sticker size={22} className="mx-auto text-caramel" />
                    <p className="mt-2 text-sm font-bold">Your basket smells… empty</p>
                    <p className="mt-1 text-xs font-medium text-cocoa/60">
                      Add something crumbly from the menu.
                    </p>
                  </div>
                )}
                {lines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-soft px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{l.name}</p>
                      <p className="text-[11px] font-semibold text-cocoa/55">
                        {l.qty} × {inr(l.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold">{inr(l.line)}</span>
                  </div>
                ))}
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-cocoa/60">
                  Note for the baker (optional)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={240}
                  placeholder="e.g. Extra frosting, deliver after 6 PM"
                  className="w-full resize-none rounded-2xl border border-sand bg-white/70 px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-cocoa/35 focus:border-caramel focus:ring-4 focus:ring-caramel/15"
                />
              </label>

              <div className="mt-5 space-y-2 border-t border-dashed border-sand pt-4">
                <div className="flex items-center justify-between text-sm font-semibold text-cocoa/70">
                  <span>Total</span>
                  <span className="font-display text-2xl text-espresso">{inr(total)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-bold">
                  <span className="inline-flex items-center gap-1.5 text-leaf">
                    <Sparkles size={14} /> Points you&apos;ll earn
                  </span>
                  <span className="text-leaf">+{pointsPreview} pt{pointsPreview === 1 ? "" : "s"}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-bold text-caramel-deep">
                  <span className="inline-flex items-center gap-1.5">
                    <Gift size={14} /> Punch card after this
                  </span>
                  <span>{(previewProgress === 0 ? 10 : previewProgress)}/10</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || lines.length === 0}
                className={clsx(
                  "group mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-extrabold shadow-warm transition disabled:cursor-not-allowed disabled:opacity-50",
                  hitsMilestone && lines.length > 0
                    ? "bg-gradient-to-r from-caramel to-caramel-deep text-cream"
                    : "bg-espresso text-cream hover:bg-caramel-deep"
                )}
              >
                {placing ? "Placing your order..." : hitsMilestone && lines.length > 0 ? (
                  <>
                    <PartyPopper size={17} /> Place my 10th order!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Place order &amp; earn points
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] font-semibold text-cocoa/50">
                Pay at pickup or delivery — points credit instantly.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
