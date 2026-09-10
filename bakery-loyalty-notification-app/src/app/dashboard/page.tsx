"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Gift,
  History,
  PartyPopper,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import {
  fetchMe,
  get,
  post,
  type ClientOrder,
  type ClientReward,
  type SessionUser,
} from "@/lib/client";
import { AppHeader, LoadingScreen } from "@/components/AppHeader";
import { PunchCard } from "@/components/PunchCard";
import { formatDate, inr, summarizeItems } from "@/lib/format";
import { MILESTONE_EVERY } from "@/lib/menu";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-butter text-cocoa",
  preparing: "bg-caramel/90 text-cream",
  ready: "bg-leaf text-cream",
  delivered: "bg-espresso text-cream",
  cancelled: "bg-berry/90 text-cream",
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<ClientOrder[] | null>(null);
  const [rewards, setRewards] = useState<ClientReward[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const user = await fetchMe();
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    setMe(user);
    const [o, r] = await Promise.all([
      get<{ orders: ClientOrder[] }>("/api/orders"),
      get<{ rewards: ClientReward[] }>("/api/rewards"),
    ]);
    setOrders(o.orders ?? []);
    setRewards(r.rewards ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const totalOrders = me?.totalOrders ?? 0;
  const points = me?.pointsBalance ?? 0;
  const progress = totalOrders % MILESTONE_EVERY;
  const remaining = MILESTONE_EVERY - progress;
  const cardsDone = Math.floor(totalOrders / MILESTONE_EVERY);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  async function redeem(id: string) {
    const res = await post<{ reward: ClientReward }>(`/api/rewards/${id}/redeem`);
    if (!res.ok) {
      toast.error(res.error ?? "Could not redeem this reward.");
      return;
    }
    toast.success("Reward redeemed! Show this at pickup.");
    setRewards((prev) =>
      prev
        ? prev.map((r) => (r.id === id ? { ...r, status: "redeemed", redeemedAt: new Date().toISOString() } : r))
        : prev
    );
  }

  if (loading || !me) return <LoadingScreen />;

  const available = (rewards ?? []).filter((r) => r.status === "available");
  const redeemed = (rewards ?? []).filter((r) => r.status === "redeemed");

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader
        me={me}
        active="/dashboard"
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/order", label: "Order Bakes" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-caramel-deep">
            The Yummy Club dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            {greeting}, <span className="italic text-caramel-deep">{me.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-2 text-sm font-semibold text-cocoa/60">
            Loyalty card: {me.mobile} · Every 10th order unlocks a free bake
          </p>
        </motion.div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left column: points + punch card */}
          <div className="space-y-6">
            {/* Points card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="grainy relative overflow-hidden rounded-[32px] bg-espresso p-7 text-cream shadow-warm sm:p-9"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-caramel/30 blur-3xl" />
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-butter">
                    Loyalty points
                  </p>
                  <p className="mt-2 font-display text-6xl leading-none sm:text-7xl">
                    {points.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-cream/60">
                    Earned over {totalOrders} order{totalOrders === 1 ? "" : "s"} · 1 point per purchase
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {cardsDone > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-caramel/20 px-4 py-1.5 text-xs font-extrabold text-butter">
                      <BadgeCheck size={14} />
                      {cardsDone} golden card{cardsDone === 1 ? "" : "s"} completed
                    </span>
                  )}
                  <Link
                    href="/order"
                    className="group inline-flex items-center gap-2 rounded-full bg-caramel px-6 py-3 text-sm font-extrabold text-espresso transition hover:-translate-y-0.5 hover:bg-butter"
                  >
                    <ShoppingBag size={16} />
                    Order fresh bakes
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Punch card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="rounded-[32px] border border-sand/70 bg-white/70 p-7 shadow-card sm:p-9"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-caramel-deep">
                    Punch card progress
                  </p>
                  <p className="mt-1 font-display text-2xl">
                    {progress === 0 ? "Fresh card, 0 of 10" : `${progress} of 10 orders`}
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-butter/70 text-caramel-deep">
                  <Sparkles size={20} />
                </span>
              </div>
              <div className="mt-6">
                <PunchCard filled={progress} pulse />
              </div>
              <p className={clsx(
                "mt-6 rounded-2xl px-4 py-3 text-[13px] font-semibold leading-relaxed",
                remaining <= 2 ? "bg-gradient-to-r from-caramel/15 to-butter/60 text-caramel-deep" : "bg-cream-soft text-cocoa/75"
              )}>
                {remaining <= 2
                  ? `So close! Just ${remaining} more order${remaining === 1 ? "" : "s"} and your FREE signature bake unlocks.`
                  : `${remaining} more order${remaining === 1 ? "" : "s"} until your FREE signature bake. Keep the crumbs coming.`}
              </p>
            </motion.div>
          </div>

          {/* Right column: rewards + history */}
          <div className="space-y-6">
            {/* Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="rounded-[32px] border border-sand/70 bg-white/70 p-7 shadow-card sm:p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Rewards wallet</h2>
                <span className="rounded-full bg-butter/70 px-3.5 py-1 text-xs font-extrabold text-caramel-deep">
                  {available.length} available
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {available.length === 0 && redeemed.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-sand bg-cream-soft/70 p-6 text-center">
                    <Gift size={22} className="mx-auto text-caramel" />
                    <p className="mt-2 text-sm font-bold text-espresso">No rewards yet</p>
                    <p className="mt-1 text-xs font-medium text-cocoa/60">
                      Complete your 10th order and a free bake lands right here.
                    </p>
                  </div>
                )}

                {available.map((r) => (
                  <div
                    key={r.id}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-caramel to-caramel-deep p-[1.5px] shadow-card"
                  >
                    <div className="rounded-[14px] bg-cream p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-caramel to-caramel-deep text-cream">
                          <PartyPopper size={19} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-espresso">{r.title}</p>
                          <p className="mt-0.5 text-xs font-medium leading-relaxed text-cocoa/65">
                            Unlocked on your {r.purchaseNumber}th order · {formatDate(r.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => redeem(r.id)}
                        className="mt-3.5 w-full rounded-xl bg-espresso py-2.5 text-xs font-extrabold text-cream transition hover:bg-caramel-deep"
                      >
                        Redeem at pickup
                      </button>
                    </div>
                  </div>
                ))}

                {redeemed.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-sand/60 bg-cream-soft/60 p-4 opacity-80">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand/50 text-cocoa/60">
                      <BadgeCheck size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-cocoa line-through decoration-2">{r.title}</p>
                      <p className="text-[11px] font-semibold text-cocoa/55">
                        Redeemed {r.redeemedAt ? formatDate(r.redeemedAt) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Order history */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="rounded-[32px] border border-sand/70 bg-white/70 p-7 shadow-card sm:p-8"
            >
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-caramel-deep" />
                <h2 className="font-display text-2xl">Order history</h2>
              </div>

              <div className="mt-5 space-y-3">
                {(orders ?? []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-sand bg-cream-soft/70 p-6 text-center">
                    <p className="text-sm font-bold text-espresso">No orders yet</p>
                    <p className="mt-1 text-xs font-medium text-cocoa/60">
                      Your first bake is waiting on the menu.
                    </p>
                    <Link href="/order" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-espresso px-5 py-2.5 text-xs font-extrabold text-cream">
                      Order now <ArrowRight size={13} />
                    </Link>
                  </div>
                )}

                {(orders ?? []).map((o) => (
                  <div
                    key={o.id}
                    className="group rounded-2xl border border-sand/60 bg-white/60 p-4 transition hover:border-caramel/50 hover:shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={clsx(
                          "grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold",
                          o.purchaseNumber % 10 === 0 ? "bg-gradient-to-br from-caramel to-caramel-deep text-cream" : "bg-butter/70 text-caramel-deep"
                        )}>
                          #{o.purchaseNumber}
                        </span>
                        <div>
                          <p className="text-sm font-bold leading-snug">{summarizeItems(o.items)}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-cocoa/55">
                            {formatDate(o.createdAt)} · {inr(o.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={clsx("rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]", STATUS_STYLES[o.status] ?? STATUS_STYLES.pending)}>
                          {o.status}
                        </span>
                        <span className="text-[11px] font-extrabold text-leaf">+{o.pointsEarned} pt{o.pointsEarned === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    {o.note && (
                      <p className="mt-2.5 rounded-xl bg-cream-soft px-3 py-2 text-[11px] font-medium italic text-cocoa/65">
                        “{o.note}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
