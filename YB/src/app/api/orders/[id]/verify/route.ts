import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { applyOrderLoyalty, getOrderHistorySummary } from "@/lib/loyalty";
import { sendWhatsApp, tplOnlineOrder, tplOwnerMilestone } from "@/lib/messaging";
import { getUserSession } from "@/lib/session";
import { cycleMessage, orderRef } from "@/lib/utils";

// Server-only: owner's WhatsApp destination for milestone alerts.
const OWNER_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || "919876500000";

/**
 * Verify a QR payment for an online order. Loyalty points are credited ONLY
 * after this verification succeeds — pending orders earn nothing.
 * Idempotent: re-verifying a paid order returns its current state.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getUserSession();
    if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId)) {
      return Response.json({ error: "Invalid order." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const txnRefRaw = String(body?.txnRef ?? "").trim().slice(0, 40);
    const paymentRef =
      txnRefRaw ||
      `UPI/${new Date().getFullYear()}/${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, session.uid)))
      .limit(1);

    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    if (order.paymentStatus === "verified") {
      const [u] = await db.select().from(users).where(eq(users.id, session.uid));
      return Response.json({
        ok: true,
        alreadyVerified: true,
        loyalty: {
          points: u.loyaltyPoints,
          cycleCount: order.milestoneHit ? 0 : u.cycleCount,
          milestone: order.milestoneHit,
        },
        message: cycleMessage(u.cycleCount, order.milestoneHit),
      });
    }

    // ---- mark paid + credit loyalty atomically --------------------------
    const outcome = await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ paymentStatus: "verified", paymentRef })
        .where(eq(orders.id, orderId));
      return applyOrderLoyalty(tx, session.uid, orderId);
    });

    // ---- customer WhatsApp: full order + payment + delivery metadata ----
    const delivery = order.delivery ?? { mode: "pickup" as const, contact: session.mobile, slot: "ASAP" };
    await sendWhatsApp({
      to: session.mobile,
      toLabel: session.name,
      userId: session.uid,
      kind: "online_order",
      body: tplOnlineOrder({
        name: session.name,
        orderId: order.id,
        items: order.items,
        total: order.totalAmount,
        paymentRef,
        delivery,
        points: outcome.points,
        cycleCount: outcome.cycleCount,
        milestone: outcome.milestone,
      }),
    });

    // ---- owner WhatsApp alert on every 5th-purchase milestone -----------
    if (outcome.milestone) {
      const history = await getOrderHistorySummary(session.uid);
      await sendWhatsApp({
        to: OWNER_NUMBER,
        toLabel: "Bakery Owner",
        kind: "milestone_owner",
        body: tplOwnerMilestone({
          name: session.name,
          mobile: session.mobile,
          ordersCount: history.ordersCount,
          lifetimeSpend: history.lifetimeSpend,
          lastAmount: order.totalAmount,
          channel: "online",
        }),
      });
    }

    return Response.json({
      ok: true,
      alreadyVerified: false,
      ref: orderRef(order.id),
      paymentRef,
      loyalty: {
        points: outcome.points,
        cycleCount: outcome.cycleCount,
        milestone: outcome.milestone,
        rewardTitle: outcome.rewardTitle,
      },
      message: cycleMessage(outcome.cycleCount, outcome.milestone),
    });
  } catch (e) {
    console.error("verify payment error", e);
    return Response.json({ error: "Payment verification failed. Try again." }, { status: 500 });
  }
}
