import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, rewards, users } from "@/db/schema";
import { CYCLE_LENGTH, REWARD_TITLE } from "./utils";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LoyaltyOutcome {
  points: number;
  cycleCount: number;
  milestone: boolean;
  rewardTitle?: string;
}

/**
 * Cyclic 5th-order loyalty engine.
 *
 * Every completed purchase (online or offline) adds +1 loyalty point and
 * increments the cycle purchase counter. When the counter reaches 5, a
 * special reward is unlocked and the counter resets so the NEXT purchase
 * counts as 1/5 of a brand new cycle — repeating indefinitely:
 * 1, 2, 3, 4, 5 [reward & reset] → 1, 2, 3 ...
 *
 * Runs inside the caller's transaction with a row lock on the user.
 */
export async function applyOrderLoyalty(
  tx: Tx,
  userId: number,
  orderId: number,
): Promise<LoyaltyOutcome> {
  const [user] = await tx
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .for("update");

  if (!user) throw new Error("User not found for loyalty credit");

  const points = user.loyaltyPoints + 1;
  let cycleCount = user.cycleCount + 1;
  const milestone = cycleCount >= CYCLE_LENGTH;

  if (milestone) {
    // Award the 5th-purchase reward, then reset the cycle counter so the
    // following purchase is counted as #1 of the next cycle.
    cycleCount = 0;
    await tx.insert(rewards).values({
      userId,
      orderId,
      title: REWARD_TITLE,
      status: "active",
    });
  }

  await tx
    .update(users)
    .set({ loyaltyPoints: points, cycleCount })
    .where(eq(users.id, userId));

  await tx
    .update(orders)
    .set({ loyaltyPointEarned: 1, milestoneHit: milestone })
    .where(eq(orders.id, orderId));

  return {
    points,
    cycleCount,
    milestone,
    rewardTitle: milestone ? REWARD_TITLE : undefined,
  };
}

/** Structured order history for owner milestone alerts. */
export async function getOrderHistorySummary(userId: number) {
  const rows = await db
    .select({ totalAmount: orders.totalAmount })
    .from(orders)
    .where(eq(orders.userId, userId));
  const ordersCount = rows.length;
  const lifetimeSpend = rows.reduce((s, r) => s + r.totalAmount, 0);
  return { ordersCount, lifetimeSpend };
}
