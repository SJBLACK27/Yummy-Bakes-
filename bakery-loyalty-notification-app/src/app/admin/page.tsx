"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronDown,
  Gift,
  IndianRupee,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  CalendarClock,
  Wallet,
  BadgeCheck,
  Phone,
} from "lucide-react";
import clsx from "clsx";
import {
  fetchMe,
  get,
  patch,
  post,
  type ClientCustomer,
  type ClientNotification,
  type ClientOrder,
  type ClientReward,
  type SessionUser,
} from "@/lib/client";
import { AppHeader, LoadingScreen } from "@/components/AppHeader";
import { formatDate, formatDateTime, inr, summarizeItems } from "@/lib/format";

type Tab = "overview" | "orders" | "customers" | "rewards" | "whatsapp";

type Stats = {
  revenue: number;
  orders: number;
  pointsIssued: number;
  ordersToday: number;
  customers: number;
  liveRewards: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-butter text-cocoa",
  preparing: "bg-caramel/90 text-cream",
  ready: "bg-leaf text-cream",
  delivered: "bg-espresso text-cream",
  cancelled: "bg-berry/90 text-cream",
};

const WA_STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Sent via Twilio", cls: "bg-leaf text-cream" },
  simulated: { label: "Simulated (no Twilio keys)", cls: "bg-butter text-cocoa" },
  failed: { label: "Failed", cls: "bg-berry text-cream" },
};

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [customers, setCustomers] = useState<ClientCustomer[]>([]);
  const [rewards, setRewards] = useState<ClientReward[]>([]);
  const [notes, setNotes] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    const [s, o, c, r, n] = await Promise.all([
      get<{ stats: Stats }>("/api/admin/stats"),
      get<{ orders: ClientOrder[] }>("/api/admin/orders"),
      get<{ customers: ClientCustomer[] }>("/api/admin/customers"),
      get<{ rewards: ClientReward[] }>("/api/admin/rewards"),
      get<{ notifications: ClientNotification[] }>("/api/admin/notifications"),
    ]);
    if (s.ok) setStats(s.stats);
    if (o.ok) setOrders(o.orders);
    if (c.ok) setCustomers(c.customers);
    if (r.ok) setRewards(r.rewards);
    if (n.ok) setNotes(n.notifications);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user || user.role !== "admin") {
        router.replace("/login?next=/admin");
        return;
      }
      setMe(user);
      load(true);
    });
  }, [router, load]);

  if (loading || !me) return <LoadingScreen />;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: `Orders (${orders.length})` },
    { id: "customers", label: `Customers (${customers.length})` },
    { id: "rewards", label: `Rewards (${rewards.filter((r) => r.status === "available").length} live)` },
    { id: "whatsapp", label: "WhatsApp Log" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader
        me={me}
        active="/admin"
        items={[
          { href: "/admin", label: "Owner Panel" },
          { href: "/order", label: "Order Bakes" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-caramel-deep">
              Bakery owner · {me.name}
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl">
              The <span className="italic text-caramel-deep">back-of-house</span> ledger
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-cocoa/60">
              <Phone size={14} className="text-caramel-deep" />
              Milestone alerts via WhatsApp go to {process.env.NEXT_PUBLIC_OWNER_HINT ?? "the owner number in .env"}
            </p>
          </div>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-full border border-sand bg-white/70 px-5 py-2.5 text-xs font-extrabold text-cocoa transition hover:bg-butter/60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1.5 overflow-x-auto rounded-full border border-sand bg-white/60 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-extrabold transition",
                tab === t.id ? "bg-espresso text-cream shadow-card" : "text-cocoa/70 hover:text-espresso"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            {tab === "overview" && <Overview stats={stats} orders={orders} notes={notes} go={setTab} />}
            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                onStatus={async (id, status) => {
                  const res = await patch(`/api/admin/orders/${id}`, { status });
                  if (!res.ok) toast.error(res.error ?? "Update failed");
                  else {
                    toast.success(`Order marked as ${status}`);
                    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as ClientOrder["status"] } : o)));
                  }
                }}
              />
            )}
            {tab === "customers" && (
              <CustomersTab
                customers={customers}
                onCredit={async (userId, delta) => {
                  const res = await post<{ customer: { pointsBalance: number } }>("/api/admin/points", { userId, points: delta });
                  if (!res.ok) toast.error(res.error ?? "Could not update points");
                  else {
                    toast.success(`${delta > 0 ? "Credited" : "Debited"} ${Math.abs(delta)} points`);
                    setCustomers((prev) =>
                      prev.map((c) => (c.id === userId ? { ...c, pointsBalance: res.customer!.pointsBalance } : c))
                    );
                  }
                }}
              />
            )}
            {tab === "rewards" && (
              <RewardsTab
                rewards={rewards}
                onSet={async (id, status) => {
                  const res = await patch(`/api/admin/rewards/${id}`, { status });
                  if (!res.ok) toast.error(res.error ?? "Update failed");
                  else {
                    toast.success(status === "redeemed" ? "Reward marked as redeemed" : "Reward re-opened");
                    setRewards((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? { ...r, status, redeemedAt: status === "redeemed" ? new Date().toISOString() : null }
                          : r
                      )
                    );
                  }
                }}
              />
            )}
            {tab === "whatsapp" && <WhatsAppTab notes={notes} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* -------------------------------- Overview ------------------------------- */

function Overview({ stats, orders, notes, go }: { stats: Stats | null; orders: ClientOrder[]; notes: ClientNotification[]; go: (t: Tab) => void }) {
  const cards = [
    { icon: IndianRupee, label: "Total revenue", value: inr(stats?.revenue ?? 0), tint: "from-caramel to-caramel-deep text-cream" },
    { icon: Package, label: "Lifetime orders", value: (stats?.orders ?? 0).toLocaleString("en-IN"), tint: "bg-butter text-caramel-deep" },
    { icon: CalendarClock, label: "Orders today", value: (stats?.ordersToday ?? 0).toString(), tint: "bg-leaf/15 text-leaf" },
    { icon: Users, label: "Customers", value: (stats?.customers ?? 0).toString(), tint: "bg-cream-soft text-cocoa" },
    { icon: Sparkles, label: "Points issued", value: (stats?.pointsIssued ?? 0).toLocaleString("en-IN"), tint: "bg-butter text-caramel-deep" },
    { icon: Gift, label: "Live rewards", value: (stats?.liveRewards ?? 0).toString(), tint: "bg-berry/10 text-berry" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-3xl border border-sand/70 bg-white/70 p-5 shadow-card"
          >
            <span className={clsx("grid h-10 w-10 place-items-center rounded-xl", c.tint.includes("from-") ? `bg-gradient-to-br ${c.tint}` : c.tint)}>
              <c.icon size={18} />
            </span>
            <p className="mt-3.5 font-display text-3xl">{c.value}</p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-cocoa/55">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-[28px] border border-sand/70 bg-white/70 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl">Latest orders</h3>
            <button onClick={() => go("orders")} className="text-xs font-extrabold text-caramel-deep underline underline-offset-4">View all</button>
          </div>
          <div className="mt-4 space-y-2.5">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-soft px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{o.customerName}</p>
                  <p className="truncate text-[11px] font-semibold text-cocoa/55">{summarizeItems(o.items)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-extrabold">{inr(o.totalAmount)}</span>
                  <span className={clsx("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase", STATUS_STYLES[o.status])}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp feed */}
        <div className="rounded-[28px] border border-sand/70 bg-espresso p-6 text-cream shadow-warm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 font-display text-xl">
              <MessageCircle size={18} className="text-caramel" /> WhatsApp alerts
            </h3>
            <button onClick={() => go("whatsapp")} className="text-xs font-extrabold text-butter underline underline-offset-4">Open log</button>
          </div>
          <div className="mt-4 space-y-2.5">
            {notes.length === 0 && (
              <p className="rounded-2xl border border-dashed border-cream/20 p-5 text-center text-xs font-semibold text-cream/60">
                No milestone alerts yet — they appear when a customer completes their 10th purchase.
              </p>
            )}
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className="rounded-2xl bg-cream/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-bold">{n.customerName ?? "Customer"}</p>
                  <span className={clsx("rounded-full px-2.5 py-1 text-[10px] font-extrabold", WA_STATUS[n.status].cls, n.status === "sent" && "text-cream")}>{WA_STATUS[n.status].label}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-[11px] leading-relaxed text-cream/60">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Orders -------------------------------- */

function OrdersTab({ orders, onStatus }: { orders: ClientOrder[]; onStatus: (id: string, status: string) => void }) {
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const milestone = o.purchaseNumber % 10 === 0;
        return (
          <div
            key={o.id}
            className={clsx(
              "rounded-3xl border bg-white/70 p-5 shadow-card transition",
              milestone ? "border-caramel/60 ring-2 ring-caramel/15" : "border-sand/70"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3.5">
                <span
                  className={clsx(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xs font-extrabold",
                    milestone ? "bg-gradient-to-br from-caramel to-caramel-deep text-cream" : "bg-butter/70 text-caramel-deep"
                  )}
                >
                  #{o.purchaseNumber}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{o.customerName}</p>
                    <span className="text-[11px] font-bold text-cocoa/50">{o.customerMobile}</span>
                    {milestone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-caramel to-caramel-deep px-2.5 py-0.5 text-[10px] font-extrabold text-cream">
                        <Gift size={10} /> 10th order
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[13px] font-semibold text-cocoa/75">{summarizeItems(o.items)}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-cocoa/50">
                    {formatDateTime(o.createdAt)} · {inr(o.totalAmount)} · +{o.pointsEarned} pts
                  </p>
                  {o.note && (
                    <p className="mt-2 rounded-xl bg-cream-soft px-3 py-2 text-[11px] font-medium italic text-cocoa/65">
                      “{o.note}”
                    </p>
                  )}
                </div>
              </div>

              <label className="relative inline-flex items-center">
                <select
                  value={o.status}
                  onChange={(e) => onStatus(o.id, e.target.value)}
                  className={clsx(
                    "cursor-pointer appearance-none rounded-full py-2 pl-4 pr-9 text-[11px] font-extrabold uppercase tracking-[0.06em] outline-none transition",
                    STATUS_STYLES[o.status]
                  )}
                >
                  {Object.keys(STATUS_STYLES).map((s) => (
                    <option key={s} value={s} className="bg-white text-espresso">{s}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-3 text-current opacity-70" />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- Customers ------------------------------ */

function CustomersTab({ customers, onCredit }: { customers: ClientCustomer[]; onCredit: (userId: string, delta: number) => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {customers.map((c) => {
        const progress = c.totalOrders % 10;
        return (
          <div key={c.id} className="rounded-3xl border border-sand/70 bg-white/70 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-caramel to-caramel-deep text-sm font-extrabold text-cream">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-extrabold">{c.name}</p>
                  <p className="text-[11px] font-bold text-cocoa/55">{c.mobile} · since {formatDate(c.createdAt)}</p>
                </div>
              </div>
              {c.availableRewards > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-caramel to-caramel-deep px-3 py-1.5 text-[10px] font-extrabold text-cream">
                  <Gift size={11} /> {c.availableRewards} free bake{c.availableRewards > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-cream-soft p-3 text-center">
                <p className="font-display text-2xl">{c.totalOrders}</p>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-cocoa/55">orders</p>
              </div>
              <div className="rounded-2xl bg-cream-soft p-3 text-center">
                <p className="font-display text-2xl">{c.pointsBalance.toLocaleString("en-IN")}</p>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-cocoa/55">points</p>
              </div>
              <div className="rounded-2xl bg-cream-soft p-3 text-center">
                <p className="font-display text-2xl">{progress}/10</p>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-cocoa/55">to reward</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={1}
                placeholder="Pts"
                value={amounts[c.id] ?? ""}
                onChange={(e) => setAmounts((a) => ({ ...a, [c.id]: e.target.value }))}
                className="w-24 rounded-xl border border-sand bg-white/70 px-3 py-2.5 text-sm font-bold outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/15"
              />
              <button
                onClick={() => {
                  const n = Math.trunc(Number(amounts[c.id]));
                  if (!n) return toast.error("Enter a points amount first.");
                  onCredit(c.id, n);
                  setAmounts((a) => ({ ...a, [c.id]: "" }));
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-espresso px-4 py-2.5 text-xs font-extrabold text-cream transition hover:bg-caramel-deep"
              >
                <Wallet size={13} /> Credit
              </button>
              <button
                onClick={() => {
                  const n = Math.trunc(Number(amounts[c.id]));
                  if (!n) return toast.error("Enter a points amount first.");
                  onCredit(c.id, -n);
                  setAmounts((a) => ({ ...a, [c.id]: "" }));
                }}
                className="rounded-xl border border-sand px-4 py-2.5 text-xs font-extrabold text-cocoa transition hover:bg-butter/60"
              >
                Debit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Rewards ------------------------------- */

function RewardsTab({ rewards, onSet }: { rewards: ClientReward[]; onSet: (id: string, status: "redeemed" | "available") => void }) {
  if (rewards.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-sand bg-cream-soft/70 p-10 text-center">
        <Gift size={26} className="mx-auto text-caramel" />
        <p className="mt-3 text-sm font-bold">No rewards triggered yet</p>
        <p className="mt-1 text-xs font-medium text-cocoa/60">They appear automatically when customers hit their 10th order.</p>
      </div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rewards.map((r) => (
        <div
          key={r.id}
          className={clsx(
            "rounded-3xl border p-6 shadow-card",
            r.status === "available"
              ? "border-caramel/60 bg-gradient-to-br from-butter/50 to-white/70"
              : "border-sand/70 bg-white/60 opacity-75"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={clsx(
                "grid h-11 w-11 place-items-center rounded-2xl",
                r.status === "available" ? "bg-gradient-to-br from-caramel to-caramel-deep text-cream" : "bg-sand/60 text-cocoa/60"
              )}>
                {r.status === "available" ? <Gift size={19} /> : <BadgeCheck size={19} />}
              </span>
              <div>
                <p className="text-sm font-extrabold">{r.customerName}</p>
                <p className="text-[11px] font-bold text-cocoa/55">{r.customerMobile}</p>
              </div>
            </div>
            <span className={clsx(
              "rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]",
              r.status === "available" ? "bg-leaf text-cream" : "bg-espresso/80 text-cream"
            )}>
              {r.status}
            </span>
          </div>
          <p className="mt-4 text-sm font-bold text-espresso">{r.title}</p>
          <p className="mt-1 text-[12px] font-semibold text-cocoa/60">
            Earned on the {r.purchaseNumber}th order · {formatDate(r.createdAt)}
            {r.redeemedAt && ` · redeemed ${formatDate(r.redeemedAt)}`}
          </p>
          <button
            onClick={() => onSet(r.id, r.status === "available" ? "redeemed" : "available")}
            className={clsx(
              "mt-4 w-full rounded-xl py-2.5 text-xs font-extrabold transition",
              r.status === "available"
                ? "bg-espresso text-cream hover:bg-caramel-deep"
                : "border border-sand text-cocoa hover:bg-butter/60"
            )}
          >
            {r.status === "available" ? "Mark as redeemed" : "Re-open reward"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- WhatsApp ------------------------------- */

function WhatsAppTab({ notes }: { notes: ClientNotification[] }) {
  const [openId, setOpenId] = useState<string | null>(notes[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-6 rounded-3xl bg-espresso p-6 text-cream shadow-warm">
        <div>
          <h3 className="flex items-center gap-2.5 font-display text-2xl">
            <Send size={19} className="text-caramel" /> Automated WhatsApp alerts
          </h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/70">
            Every time a customer completes their 10th purchase, the loyalty
            engine instantly composes this message and sends it to your phone
            via Twilio&apos;s WhatsApp API. When Twilio environment variables
            aren&apos;t configured, the message is logged here as
            &quot;simulated&quot; so the full flow is still auditable.
          </p>
        </div>
      </div>

      {notes.length === 0 && (
        <div className="rounded-3xl border border-dashed border-sand bg-cream-soft/70 p-10 text-center">
          <MessageCircle size={26} className="mx-auto text-caramel" />
          <p className="mt-3 text-sm font-bold">No alerts yet</p>
          <p className="mt-1 text-xs font-medium text-cocoa/60">
            They&apos;ll appear here the moment a customer hits their 10th order.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {notes.map((n) => {
          const open = openId === n.id;
          const meta = WA_STATUS[n.status];
          return (
            <div key={n.id} className="overflow-hidden rounded-3xl border border-sand/70 bg-white/70 shadow-card">
              <button
                onClick={() => setOpenId(open ? null : n.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={clsx("grid h-10 w-10 place-items-center rounded-xl",
                    n.status === "sent" ? "bg-leaf/15 text-leaf" : n.status === "failed" ? "bg-berry/15 text-berry" : "bg-butter text-caramel-deep"
                  )}>
                    <MessageCircle size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{n.customerName ?? "Customer"}</p>
                    <p className="text-[11px] font-bold text-cocoa/55">To: {n.toNumber} · {formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={clsx("rounded-full px-3 py-1 text-[10px] font-extrabold", meta.cls, n.status === "sent" && "text-cream")}>
                    {meta.label}
                  </span>
                  <ChevronDown size={15} className={clsx("text-cocoa/50 transition-transform", open && "rotate-180")} />
                </div>
              </button>
              {open && (
                <div className="border-t border-dashed border-sand px-6 py-4">
                  <p className="whitespace-pre-line rounded-2xl bg-cream-soft p-4 font-mono text-[12px] leading-relaxed text-cocoa">
                    {n.body}
                  </p>
                  {n.error && (
                    <p className="mt-2.5 rounded-xl bg-berry/10 px-4 py-2.5 text-[11px] font-bold text-berry">
                      Twilio error: {n.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
