"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BellRing,
  Croissant,
  Gift,
  IndianRupee,
  Loader2,
  LogOut,
  MessageSquareText,
  QrCode,
  Receipt,
  RefreshCw,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { CYCLE_LENGTH, displayMobile, inr, orderRef } from "@/lib/utils";

interface AdminOverview {
  gateway: "live" | "simulated";
  stats: {
    orders: number;
    revenue: number;
    customers: number;
    rewardsTotal: number;
    rewardsActive: number;
  };
  orders: {
    id: number;
    kind: "online" | "offline";
    items: { name: string; qty: number; price: number }[];
    total: number;
    paymentStatus: string;
    paymentRef: string | null;
    delivery: { mode: string; address?: string; contact: string; slot: string } | null;
    loyaltyPointEarned: number;
    milestoneHit: boolean;
    createdAt: string;
    userName: string | null;
    userMobile: string | null;
  }[];
  customers: {
    id: number;
    name: string;
    mobile: string;
    points: number;
    cycleCount: number;
    registered: boolean;
    createdAt: string;
    orderCount: number;
    spend: number;
  }[];
  rewards: {
    id: number;
    title: string;
    status: string;
    awardedAt: string;
    userName: string | null;
    userMobile: string | null;
  }[];
  notifications: {
    id: number;
    channel: "sms" | "whatsapp";
    toNumber: string;
    toLabel: string | null;
    kind: string;
    body: string;
    status: string;
    createdAt: string;
  }[];
}

interface PosResult {
  ref: string;
  guestCreated: boolean;
  customer: { id: number; name: string; mobile: string; points: number; cycleCount: number };
  milestone: boolean;
  rewardTitle?: string;
  message: string;
}

type Tab = "orders" | "customers" | "rewards" | "gateway";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminClient() {
  const router = useRouter();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [posBusy, setPosBusy] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  const [posResult, setPosResult] = useState<PosResult | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = await res.json();
      if (json.ok) setData(json);
    } catch {
      /* keep old data */
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function submitPos(e: React.FormEvent) {
    e.preventDefault();
    if (posBusy) return;
    setPosError(null);
    setPosResult(null);
    setPosBusy(true);
    try {
      const res = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, amount: Number(amount), note }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPosResult(json);
        setAmount("");
        setNote("");
        void load();
      } else {
        setPosError(json.error || "POS entry failed.");
      }
    } catch {
      setPosError("Network error. Please try again.");
    } finally {
      setPosBusy(false);
    }
  }

  async function markRedeemed(id: number) {
    await fetch(`/api/rewards/${id}/redeem`, { method: "POST" });
    void load();
  }

  const stats = data?.stats;

  return (
    <main className="min-h-screen bg-cocoa text-cream">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-cocoa/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-gold text-cocoa">
              <Croissant className="size-4.5" strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-none">Yummy Bakes</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                Owner console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <span
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:flex ${
                  data.gateway === "live" ? "bg-moss/20 text-moss" : "bg-gold/15 text-gold"
                }`}
              >
                <Zap className="size-3.5" />
                Gateway: {data.gateway === "live" ? "Twilio live" : "Simulated (demo)"}
              </span>
            )}
            <button
              onClick={() => void load()}
              className="grid size-9 place-items-center rounded-full border border-cream/15 text-cream/70 transition hover:text-gold"
              aria-label="Refresh"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-extrabold text-cocoa transition hover:bg-gold"
            >
              <LogOut className="size-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Receipt, label: "Total orders", value: stats?.orders ?? "—" },
            { icon: IndianRupee, label: "Lifetime revenue", value: stats ? inr(stats.revenue) : "—" },
            { icon: Users, label: "Customers", value: stats?.customers ?? "—" },
            { icon: Gift, label: "Active rewards", value: stats?.rewardsActive ?? "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-cream/10 bg-bark/40 p-5"
            >
              <s.icon className="size-5 text-gold" />
              <p className="mt-3 font-display text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-cream/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          {/* ----------------------------------------------- POS panel */}
          <section className="h-fit rounded-3xl border border-gold/25 bg-bark/40 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Store className="size-5 text-gold" /> Walk-in POS entry
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-cream/55">
              For counter customers paying via the in-store QR scanner. Instantly adds
              +1 point, advances the 5th-order cycle and WhatsApps the customer.
            </p>

            <form onSubmit={submitPos} className="mt-5 space-y-4">
              <div>
                <label htmlFor="pos-mobile" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                  Customer mobile number
                </label>
                <div className="mt-1.5 flex overflow-hidden rounded-xl border border-cream/20 bg-cocoa/60 transition focus-within:border-gold">
                  <span className="grid place-items-center border-r border-cream/10 px-3.5 text-sm font-bold text-cream/60">
                    +91
                  </span>
                  <input
                    id="pos-mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="98765 43210"
                    className="w-full px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/30"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pos-amount" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                  Bill value (₹)
                </label>
                <input
                  id="pos-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
                  inputMode="numeric"
                  placeholder="e.g. 320"
                  className="mt-1.5 w-full rounded-xl border border-cream/20 bg-cocoa/60 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold placeholder:text-cream/30"
                />
              </div>
              <div>
                <label htmlFor="pos-note" className="text-xs font-bold uppercase tracking-wide text-cream/60">
                  Note (optional)
                </label>
                <input
                  id="pos-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 2 croissants + 1 sourdough"
                  className="mt-1.5 w-full rounded-xl border border-cream/20 bg-cocoa/60 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold placeholder:text-cream/30"
                />
              </div>

              {posError && (
                <p className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
                  {posError}
                </p>
              )}

              <button
                type="submit"
                disabled={posBusy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-extrabold text-cocoa transition hover:bg-cream disabled:opacity-50"
              >
                {posBusy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                Complete scanner sale
              </button>
            </form>

            {posResult && (
              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  posResult.milestone
                    ? "border-gold bg-gold/15"
                    : "border-moss/40 bg-moss/10"
                }`}
              >
                <p className="flex items-center gap-2 font-bold">
                  <BadgeCheck className={`size-5 ${posResult.milestone ? "text-gold" : "text-moss"}`} />
                  Sale {posResult.ref} recorded for {posResult.customer.name}
                </p>
                <p className="mt-1 text-xs text-cream/60">
                  {displayMobile(posResult.customer.mobile)}
                  {posResult.guestCreated && " · guest profile auto-created"}
                </p>
                <div className="mt-4 flex gap-1.5">
                  {Array.from({ length: CYCLE_LENGTH }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 flex-1 rounded-full ${
                        i < posResult.customer.cycleCount ? "bg-gold" : "bg-cream/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-cream/85">{posResult.message}</p>
                {posResult.milestone && (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-gold/20 px-3 py-2 text-sm font-bold text-gold">
                    <BellRing className="mt-0.5 size-4 shrink-0" />
                    Milestone! Customer AND owner WhatsApp alerts were dispatched — reward: {posResult.rewardTitle}
                  </p>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-cream/50">
                  <MessageSquareText className="size-3.5" />
                  Customer receipt sent on WhatsApp · lifetime points: {posResult.customer.points}
                </p>
              </div>
            )}
          </section>

          {/* ----------------------------------------------- data tabs */}
          <section className="rounded-3xl border border-cream/10 bg-bark/40 p-6">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(
                [
                  { id: "orders", label: "Orders", icon: Receipt },
                  { id: "customers", label: "Customers", icon: Users },
                  { id: "rewards", label: "Rewards", icon: Gift },
                  { id: "gateway", label: "Gateway log", icon: MessageSquareText },
                ] as { id: Tab; label: string; icon: typeof Receipt }[]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    tab === t.id ? "bg-gold text-cocoa" : "border border-cream/15 text-cream/60 hover:text-cream"
                  }`}
                >
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5 max-h-[34rem] overflow-y-auto pr-1">
              {!data && (
                <div className="flex items-center justify-center gap-2 py-20 text-cream/50">
                  <Loader2 className="size-5 animate-spin" /> Loading…
                </div>
              )}

              {data && tab === "orders" && (
                <ul className="space-y-3">
                  {data.orders.map((o) => (
                    <li key={o.id} className="rounded-2xl border border-cream/10 bg-cocoa/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold">{orderRef(o.id)}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              o.kind === "offline" ? "bg-gold/20 text-gold" : "bg-cream/15 text-cream/80"
                            }`}
                          >
                            {o.kind === "offline" ? "POS" : "Online"}
                          </span>
                          {o.milestoneHit && (
                            <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gold">
                              <Gift className="size-3" /> 5th
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-cream/45">{fmtDate(o.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-cream/80">
                        {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-cream/55">
                          {o.userName ?? "—"} · {o.userMobile ? displayMobile(o.userMobile) : "—"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold ${
                              o.paymentStatus === "pending"
                                ? "bg-gold/15 text-gold"
                                : "bg-moss/20 text-moss"
                            }`}
                          >
                            {o.paymentStatus === "pending"
                              ? "QR pending"
                              : o.paymentStatus === "paid-in-store"
                                ? "Paid in-store"
                                : "Paid · verified"}
                          </span>
                          <span className="font-display text-sm font-bold text-cream">
                            {inr(o.total)}
                          </span>
                        </div>
                      </div>
                      {o.delivery && (
                        <p className="mt-1.5 text-[11px] text-cream/50">
                          {o.delivery.mode === "pickup"
                            ? `Pickup · ${o.delivery.slot}`
                            : `Deliver to: ${o.delivery.address} · ${o.delivery.slot}`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {data && tab === "customers" && (
                <ul className="space-y-3">
                  {data.customers.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-cream/10 bg-cocoa/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-sm font-bold">{c.name}</p>
                        <div className="flex items-center gap-2 text-[11px]">
                          {!c.registered && (
                            <span className="rounded-full bg-cream/10 px-2 py-0.5 font-bold text-cream/50">
                              Guest (unregistered)
                            </span>
                          )}
                          <span className="text-cream/45">{displayMobile(c.mobile)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {Array.from({ length: CYCLE_LENGTH }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${i < c.cycleCount ? "bg-gold" : "bg-cream/15"}`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-cream/55">
                        <span>Cycle {c.cycleCount}/{CYCLE_LENGTH}</span>
                        <span>{c.points} points</span>
                        <span>{c.orderCount} orders</span>
                        <span>{inr(c.spend)} spent</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {data && tab === "rewards" && (
                <ul className="space-y-3">
                  {data.rewards.length === 0 && (
                    <p className="py-16 text-center text-sm text-cream/45">
                      No rewards unlocked yet — they appear when a customer hits their 5th purchase.
                    </p>
                  )}
                  {data.rewards.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream/10 bg-cocoa/50 p-4">
                      <div>
                        <p className="flex items-center gap-2 font-display text-sm font-bold">
                          <Gift className="size-4 text-gold" /> {r.title}
                        </p>
                        <p className="mt-1 text-[11px] text-cream/50">
                          {r.userName} · {r.userMobile ? displayMobile(r.userMobile) : ""} · {fmtDate(r.awardedAt)}
                        </p>
                      </div>
                      {r.status === "active" ? (
                        <button
                          onClick={() => void markRedeemed(r.id)}
                          className="rounded-full bg-gold px-4 py-2 text-[11px] font-extrabold text-cocoa transition hover:bg-cream"
                        >
                          Mark redeemed
                        </button>
                      ) : (
                        <span className="rounded-full bg-moss/20 px-3 py-1.5 text-[11px] font-extrabold text-moss">
                          Redeemed
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {data && tab === "gateway" && (
                <ul className="space-y-3">
                  {data.notifications.length === 0 && (
                    <p className="py-16 text-center text-sm text-cream/45">
                      No messages dispatched yet.
                    </p>
                  )}
                  {data.notifications.map((n) => (
                    <li key={n.id} className="rounded-2xl border border-cream/10 bg-cocoa/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              n.channel === "whatsapp" ? "bg-moss/20 text-moss" : "bg-gold/20 text-gold"
                            }`}
                          >
                            {n.channel}
                          </span>
                          <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cream/60">
                            {n.kind.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-cream/50">
                            to {n.toLabel ?? ""} {displayMobile(n.toNumber.length > 10 ? n.toNumber.slice(-10) : n.toNumber)}
                          </span>
                        </div>
                        <span className="text-[11px] text-cream/45">
                          {fmtDate(n.createdAt)} · {n.status}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-cream/80">
                        {n.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
