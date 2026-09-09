import { NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const customers = await db
    .select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      pointsBalance: users.pointsBalance,
      totalOrders: users.totalOrders,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "customer"))
    .orderBy(asc(users.name));

  const live = await db
    .select({ userId: rewards.userId, available: count() })
    .from(rewards)
    .where(eq(rewards.status, "available"))
    .groupBy(rewards.userId);

  const rewardMap = new Map(live.map((r) => [r.userId, r.available]));

  return NextResponse.json({
    ok: true,
    customers: customers.map((c) => ({
      ...c,
      availableRewards: rewardMap.get(c.id) ?? 0,
    })),
  });
}
