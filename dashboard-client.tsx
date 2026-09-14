"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Croissant,
  Gift,
  Loader2,
  LogOut,
  MapPin,
  MessageSquareText,
  QrCode,
  Receipt,
  RotateCcw,
}

from "lucide-react";
import type { UserSession } from "@/lib/session";
import { CYCLE_LENGTH, inr, orderRef, REWARD_TITLE } from "@/lib/utils";

interface OrderRow {
  id: number;
  kind: "online" | "offline";
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  paymentStatus: string;
  paymentRef: string | null;
  delivery: { mode: string; address?: string; contact: string; slot: string } | null;
  milestoneHit: boolean;
  createdAt: string;
}

interface RewardRow {
  id: number;
  title: string;
  status: string;
  awardedAt: string;
}

interface InboxRow {
  id: number;
  channel: "sms" | "whatsapp";
  kind: string;
  body: string;
  status: string;
  createdAt: string;
}

interface Overview {
  user: {
    id: number;
    name: string;
    mobile: string;
    points: number;
    cycleCount: number;
    memberSince: string;
  };
  orders: OrderRow[];
  rewards: RewardRow[];
  inbox: InboxRow[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentChip(status: string) {
  switch (status) {
    case "verified":
      return { label: "Paid via QR · Verified", cls: "bg-moss/15 text-moss" };
    case "paid-in-store":
      return { label: "Paid in-store · Scanner", cls: "bg-moss/15 text-moss" };
    default:
      return { label: "Awaiting QR payment", cls: "bg-gold/20 text-ember" };
  }
}

export function DashboardClient({ session }: { session: UserSession }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/overview", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?next=/dashboard");
        return;
      }
      const json = await res.json();
      if (json.ok) setData(json);
      else setError(json.error || "Could not load dashboard.");
    } catch {
      setError("Network error. Please refresh.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  async function redeem(id: number) {
    setRedeeming(id);
    try {
      await fetch(`/api/rewards/${id}/redeem`, { method: "POST" });
      await load();
    } finally {
      setRedeeming(null);
    }
  }

  const user = data?.user;
  const cycle = user?.cycleCount ?? 0;
  const activeRewards = data?.rewards.filter((r) => r.status === "active") ?? [];
  const pastRewards = data?.rewards.filter((r) => r.status !== "active") ?? [];
  const left = CYCLE_LENGTH - cycle;

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-caramel text-ivory">
              <Croissant className="size-4.5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-semibold text-cocoa">Yummy Bakes</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/#menu"
              className="hidden items-center gap-1.5 rounded-full border border-cocoa/15 px-4 py-2 text-xs font-bold text-cocoa transition hover:border-caramel hover:text-caramel sm:flex"
            >
              <ArrowLeft className="size-3.5" /> Order again
            </Link>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-full bg-cocoa px-4 py-2 text-xs font-bold text-ivory transition hover:bg-bark"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-caramel">
          My bakery circle
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-cocoa sm:text-4xl">
          Hello, {session.name.split(" ")[0]}
        </h1>

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        {!data && !error && (
          <div className="flex items-center justify-center gap-2 py-24 text-bark/60">
            <Loader2 className="size-5 animate-spin" /> Loading your circle…
          </div>
        )}

        {data && user && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* ------------------------------------------- loyalty hero */}
            <section className="rounded-3xl bg-cocoa p-7 text-cream shadow-soft sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                    Lifetime loyalty points
                  </p>
                  <p className="mt-2 font-display text-6xl font-bold leading-none">{user.points}</p>
                  <p className="mt-2 text-xs text-cream/60">
                    +1 point for every purchase — online or at the counter.
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-full bg-gold/15">
                  <Gift className="size-6 text-gold" />
                </span>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-cream/60">
                  <span>Current cycle</span>
                  <span>
                    {cycle}/{CYCLE_LENGTH} towards next reward
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: CYCLE_LENGTH }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 flex-1 rounded-full transition-all duration-500 ${
                        i < cycle ? "bg-gold shadow-[0_0_12px_rgba(224,169,62,0.5)]" : "bg-cream/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-cream/80">
                  <RotateCcw className="size-4 text-gold" />
                  {left === CYCLE_LENGTH
                    ? "Fresh cycle — every purchase brings the gift closer."
                    : `${left} more purchase${left === 1 ? "" : "s"} to unlock the ${REWARD_TITLE}.`}
                </p>
              </div>

              {activeRewards.length > 0 && (
                <div className="mt-6 space-y-3">
                  {activeRewards.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4"
                    >
                      <div>
                        <p className="flex items-center gap-2 font-display text-lg font-bold text-gold">
                          <Gift className="size-5" /> Reward unlocked!
                        </p>
                        <p className="mt-0.5 text-sm text-cream/85">{r.title} — on your next visit.</p>
                      </div>
                      <button
                        onClick={() => void redeem(r.id)}
                        disabled={redeeming === r.id}
                        className="rounded-full bg-gold px-5 py-2.5 text-xs font-extrabold text-cocoa transition hover:bg-cream disabled:opacity-50"
                      >
                        {redeeming === r.id ? "Marking…" : "Mark redeemed"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pastRewards.length > 0 && (
                <p className="mt-5 text-xs text-cream/50">
                  {pastRewards.length} reward{pastRewards.length === 1 ? "" : "s"} redeemed so far.
                </p>
              )}
            </section>

            {/* ----------------------------------------------- inbox */}
            <section className="flex flex-col rounded-3xl border border-cocoa/10 bg-ivory p-6 shadow-lift">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-cocoa">
                <MessageSquareText className="size-5 text-caramel" /> Message inbox
              </h2>
              <p className="mt-1 text-xs text-bark/60">
                SMS OTPs & WhatsApp order updates sent to +91 {user.mobile}.
              </p>
              <div className="mt-4 max-h-[22rem] flex-1 space-y-3 overflow-y-auto pr-1">
                {data.inbox.length === 0 && (
                  <p className="rounded-xl bg-cream px-4 py-6 text-center text-sm text-bark/50">
                    No messages yet — they&apos;ll arrive after your next order.
                  </p>
                )}
                {data.inbox.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-cocoa/8 bg-cream/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          m.channel === "whatsapp"
                            ? "bg-moss/15 text-moss"
                            : "bg-caramel/15 text-ember"
                        }`}
                      >
                        {m.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                      </span>
                      <span className="text-[11px] text-bark/50">
                        {fmtDate(m.createdAt)} · {m.status === "simulated" ? "demo gateway" : m.status}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-bark/85">
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------- orders */}
        {data && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-cocoa">
              <Receipt className="size-5 text-caramel" /> Order history
            </h2>
            {data.orders.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-cocoa/20 bg-ivory px-6 py-12 text-center">
                <p className="font-display text-lg text-cocoa">No orders yet</p>
                <p className="mt-1 text-sm text-bark/60">
                  Your first purchase starts your loyalty cycle (1/{CYCLE_LENGTH}).
                </p>
                <Link
                  href="/#menu"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-caramel px-6 py-3 text-sm font-bold text-ivory transition hover:bg-ember"
                >
                  Browse the bake list
                </Link>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-3xl border border-cocoa/10 bg-ivory shadow-lift">
                <ul className="divide-y divide-cocoa/8">
                  {data.orders.map((o) => {
                    const chip = paymentChip(o.paymentStatus);
                    return (
                      <li key={o.id} className="p-5 sm:px-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-base font-bold text-cocoa">
                              {orderRef(o.id)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                o.kind === "offline"
                                  ? "bg-caramel/15 text-ember"
                                  : "bg-cocoa/8 text-bark"
                              }`}
                            >
                              {o.kind === "offline" ? "Walk-in POS" : "Online"}
                            </span>
                            {o.milestoneHit && (
                              <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ember">
                                <Gift className="size-3" /> 5th-order reward
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-bark/50">{fmtDate(o.createdAt)}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="max-w-xl text-sm text-bark/75">
                            {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                          </p>
                          <p className="font-display text-lg font-bold text-cocoa">
                            {inr(o.totalAmount)}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${chip.cls}`}>
                            {o.paymentStatus === "pending" ? (
                              <QrCode className="size-3" />
                            ) : (
                              <BadgeCheck className="size-3" />
                            )}
                            {chip.label}
                          </span>
                          <span className="rounded-full bg-caramel/12 px-2.5 py-1 text-ember">
                            +{o.milestoneHit || o.paymentStatus !== "pending" ? 1 : 0} loyalty point
                          </span>
                          {o.delivery && (
                            <span className="flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-bark/70">
                              {o.delivery.mode === "pickup" ? (
                                <Clock3 className="size-3" />
                              ) : (
                                <MapPin className="size-3" />
                              )}
                              {o.delivery.mode === "pickup"
                                ? `Pickup · ${o.delivery.slot}`
                                : `Delivery · ${o.delivery.slot}`}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
