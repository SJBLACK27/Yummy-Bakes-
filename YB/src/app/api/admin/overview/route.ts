import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orders, rewards, users } from "@/db/schema";
import { gatewayIsLive } from "@/lib/messaging";
import { isAdmin } from "@/lib/session";

/** Aggregated admin dashboard payload. */
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [orderStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
    })
    .from(orders);

  const [customerStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  const [rewardStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${rewards.status} = 'active')::int`,
    })
    .from(rewards);

  const orderRows = await db
    .select({
      order: orders,
      userName: users.name,
      userMobile: users.mobile,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(40);

  const customerRows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(60);

  const orderCounts = await db
    .select({
      userId: orders.userId,
      count: sql<number>`count(*)::int`,
      spend: sql<number>`coalesce(sum(${orders.totalAmount}),0)::int`,
    })
    .from(orders)
    .groupBy(orders.userId);

  const spendMap = new Map(orderCounts.map((r) => [r.userId, r]));

  const rewardRows = await db
    .select({ reward: rewards, userName: users.name, userMobile: users.mobile })
    .from(rewards)
    .leftJoin(users, eq(rewards.userId, users.id))
    .orderBy(desc(rewards.awardedAt))
    .limit(40);

  const notificationRows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(40);

  return Response.json({
    ok: true,
    gateway: gatewayIsLive() ? "live" : "simulated",
    stats: {
      orders: orderStats.count,
      revenue: orderStats.revenue,
      customers: customerStats.count,
      rewardsTotal: rewardStats.total,
      rewardsActive: rewardStats.active,
    },
    orders: orderRows.map((r) => ({
      id: r.order.id,
      kind: r.order.kind,
      items: r.order.items,
      total: r.order.totalAmount,
      paymentStatus: r.order.paymentStatus,
      paymentRef: r.order.paymentRef,
      delivery: r.order.delivery,
      loyaltyPointEarned: r.order.loyaltyPointEarned,
      milestoneHit: r.order.milestoneHit,
      createdAt: r.order.createdAt,
      userName: r.userName,
      userMobile: r.userMobile,
    })),
    customers: customerRows.map((u) => ({
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      points: u.loyaltyPoints,
      cycleCount: u.cycleCount,
      registered: Boolean(u.passwordHash),
      createdAt: u.createdAt,
      orderCount: spendMap.get(u.id)?.count ?? 0,
      spend: spendMap.get(u.id)?.spend ?? 0,
    })),
    rewards: rewardRows.map((r) => ({
      id: r.reward.id,
      title: r.reward.title,
      status: r.reward.status,
      awardedAt: r.reward.awardedAt,
      userName: r.userName,
      userMobile: r.userMobile,
    })),
    notifications: notificationRows,
  });
}
