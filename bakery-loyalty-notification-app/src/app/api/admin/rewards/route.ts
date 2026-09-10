import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: rewards.id,
      userId: rewards.userId,
      orderId: rewards.orderId,
      purchaseNumber: rewards.purchaseNumber,
      title: rewards.title,
      description: rewards.description,
      status: rewards.status,
      createdAt: rewards.createdAt,
      redeemedAt: rewards.redeemedAt,
      customerName: users.name,
      customerMobile: users.mobile,
    })
    .from(rewards)
    .innerJoin(users, eq(rewards.userId, users.id))
    .orderBy(desc(rewards.createdAt))
    .limit(100);

  return NextResponse.json({ ok: true, rewards: rows });
}
