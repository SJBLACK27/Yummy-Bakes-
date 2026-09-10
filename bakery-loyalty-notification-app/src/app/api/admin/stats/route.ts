import { NextResponse } from "next/server";
import { gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, rewards, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [sales] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      orders: sql<number>`count(*)::int`,
      pointsIssued: sql<number>`coalesce(sum(${orders.pointsEarned}), 0)::int`,
    })
    .from(orders)
    .where(ne(orders.status, "cancelled"));

  const [today] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(gte(orders.createdAt, startOfDay));

  const [cust] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(ne(users.role, "admin"));

  const [liveRewards] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rewards)
    .where(ne(rewards.status, "redeemed"));

  return NextResponse.json({
    ok: true,
    stats: {
      revenue: sales?.revenue ?? 0,
      orders: sales?.orders ?? 0,
      pointsIssued: sales?.pointsIssued ?? 0,
      ordersToday: today?.count ?? 0,
      customers: cust?.count ?? 0,
      liveRewards: liveRewards?.count ?? 0,
    },
  });
}
