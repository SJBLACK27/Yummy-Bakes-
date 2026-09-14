import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { applyOrderLoyalty, getOrderHistorySummary } from "@/lib/loyalty";
import { sendWhatsApp, tplOfflinePurchase, tplOwnerMilestone } from "@/lib/messaging";
import { isAdmin } from "@/lib/session";
import { cycleMessage, normalizeMobile, orderRef } from "@/lib/utils";

// Server-only: owner's WhatsApp destination for milestone alerts.
const OWNER_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || "919876500000";

/**
 * Admin POS entry — walk-in customers paying via in-store QR scanner.
 * Instantly: records the offline order, adds +1 point, advances the 5th-order
 * cycle (with reset on milestone), fires the customer WhatsApp receipt, and
 * pings the owner's WhatsApp if a milestone was unlocked.
 */
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(String(body?.mobile ?? ""));
    const amount = Math.round(Number(body?.amount));
    const note = String(body?.note ?? "").trim().slice(0, 80);

    if (!mobile) {
      return Response.json({ error: "Enter the customer's valid 10-digit mobile number." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 500000) {
      return Response.json({ error: "Enter a bill value between ₹1 and ₹5,00,000." }, { status: 400 });
    }

    const { customer, order, outcome, guestCreated } = await db.transaction(async (tx) => {
      let [user] = await tx
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .for("update");

      let created = false;
      if (!user) {
        [user] = await tx
          .insert(users)
          .values({
            name: `Guest •${mobile.slice(-4)}`,
            mobile,
            passwordHash: null,
          })
          .returning();
        created = true;
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          kind: "offline",
          items: [
            {
              name: note || "In-store purchase (walk-in · scanner payment)",
              qty: 1,
              price: amount,
            },
          ],
          totalAmount: amount,
          paymentStatus: "paid-in-store",
          paymentRef: `POS-${Date.now().toString(36).toUpperCase()}`,
        })
        .returning();

      const outcome = await applyOrderLoyalty(tx, user.id, order.id);
      return { customer: user, order, outcome, guestCreated: created };
    });

    // ---- customer WhatsApp receipt (offline purchase template) ----------
    await sendWhatsApp({
      to: customer.mobile,
      toLabel: customer.name,
      userId: customer.id,
      kind: "offline_purchase",
      body: tplOfflinePurchase({
        name: customer.name,
        amount: order.totalAmount,
        points: outcome.points,
        cycleCount: outcome.cycleCount,
        milestone: outcome.milestone,
      }),
    });

    // ---- owner WhatsApp milestone alert ---------------------------------
    if (outcome.milestone) {
      const history = await getOrderHistorySummary(customer.id);
      await sendWhatsApp({
        to: OWNER_NUMBER,
        toLabel: "Bakery Owner",
        kind: "milestone_owner",
        body: tplOwnerMilestone({
          name: customer.name,
          mobile: customer.mobile,
          ordersCount: history.ordersCount,
          lifetimeSpend: history.lifetimeSpend,
          lastAmount: order.totalAmount,
          channel: "offline",
        }),
      });
    }

    return Response.json({
      ok: true,
      ref: orderRef(order.id),
      guestCreated,
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        points: outcome.points,
        cycleCount: outcome.cycleCount,
      },
      milestone: outcome.milestone,
      rewardTitle: outcome.rewardTitle,
      message: cycleMessage(outcome.cycleCount, outcome.milestone),
    });
  } catch (e) {
    console.error("pos error", e);
    return Response.json({ error: "POS entry failed. Try again." }, { status: 500 });
  }
}
