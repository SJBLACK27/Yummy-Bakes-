import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  notifications,
  orders,
  rewards,
  users,
  type OrderLineItem,
} from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  MENU,
  MILESTONE_EVERY,
  POINTS_PER_ORDER,
  REWARD_DESCRIPTION,
  REWARD_TITLE,
} from "@/lib/menu";
import { sendOwnerMilestoneWhatsApp } from "@/lib/whatsapp";
import { formatDate, summarizeItems } from "@/lib/format";

export const dynamic = "force-dynamic";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** GET — the logged-in customer's order history */
export async function GET() {
  const session = await getSession();
  if (!session) return fail("Unauthorized", 401);

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.sub))
    .orderBy(desc(orders.createdAt))
    .limit(60);

  return NextResponse.json({ ok: true, orders: rows });
}

/**
 * POST — place an order.
 * - Prices are resolved server-side from the menu (never trust the client).
 * - Every order earns 1 loyalty point (a punch-card stamp), credited instantly.
 * - Every 10th purchase mints a reward AND fires a WhatsApp alert to the owner.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Please log in to place an order.", 401);

  const body = await req.json().catch(() => ({}));
  const rawItems: Array<{ id?: unknown; qty?: unknown }> = Array.isArray(body.items)
    ? body.items
    : [];
  const note = String(body.note ?? "").slice(0, 500).trim();

  // Resolve the basket against the trusted server-side menu
  const items: OrderLineItem[] = [];
  for (const raw of rawItems) {
    const menuItem = MENU.find((m) => m.id === String(raw.id));
    const qty = Math.max(0, Math.min(20, Math.floor(Number(raw.qty) || 0)));
    if (menuItem && qty > 0)
      items.push({ name: menuItem.name, price: menuItem.price, qty });
  }
  if (items.length === 0) return fail("Your basket is empty — add some bakes first.");

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const pointsEarned = POINTS_PER_ORDER;

  let created;
  try {
    created = await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, session.sub))
        .for("update");
      if (!user) throw new Error("user-missing");

      const purchaseNumber = user.totalOrders + 1;
      const pointsBalance = user.pointsBalance + pointsEarned;

      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          items,
          totalAmount,
          pointsEarned,
          purchaseNumber,
          note: note || null,
        })
        .returning();

      await tx
        .update(users)
        .set({ totalOrders: purchaseNumber, pointsBalance })
        .where(eq(users.id, user.id));

      let reward = null;
      if (purchaseNumber % MILESTONE_EVERY === 0) {
        const [r] = await tx
          .insert(rewards)
          .values({
            userId: user.id,
            orderId: order.id,
            purchaseNumber,
            title: REWARD_TITLE,
            description: REWARD_DESCRIPTION,
          })
          .returning();
        reward = r;
      }

      return { order, reward, purchaseNumber, pointsBalance, customer: user };
    });
  } catch {
    return fail("Could not place the order. Please try again.", 500);
  }

  // After the order is safely committed, fire the milestone WhatsApp alert
  let whatsappStatus: "sent" | "simulated" | "failed" | null = null;
  if (created.reward) {
    const recent = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.sub))
      .orderBy(desc(orders.createdAt))
      .limit(6);

    const wa = await sendOwnerMilestoneWhatsApp({
      customerName: created.customer.name,
      customerMobile: created.customer.mobile,
      totalOrders: created.purchaseNumber,
      pointsBalance: created.pointsBalance,
      lastOrderSummary: summarizeItems(items),
      lastOrderTotal: totalAmount,
      rewardTitle: REWARD_TITLE,
      recentOrders: recent.slice(1).map((o) => ({
        when: formatDate(o.createdAt),
        summary: summarizeItems(o.items),
        amount: o.totalAmount,
      })),
    });

    const [log] = await db
      .insert(notifications)
      .values({
        orderId: created.order.id,
        userId: session.sub,
        toNumber: wa.to,
        body: wa.body,
        status: wa.status,
        error: wa.error,
      })
      .returning();
    whatsappStatus = log.status as "sent" | "simulated" | "failed";
  }

  return NextResponse.json({
    ok: true,
    order: created.order,
    reward: created.reward,
    whatsapp: whatsappStatus,
    pointsBalance: created.pointsBalance,
    purchaseNumber: created.purchaseNumber,
    pointsEarned,
    progress: created.purchaseNumber % MILESTONE_EVERY,
  });
}
