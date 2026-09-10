import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      items: orders.items,
      totalAmount: orders.totalAmount,
      pointsEarned: orders.pointsEarned,
      purchaseNumber: orders.purchaseNumber,
      note: orders.note,
      status: orders.status,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerMobile: users.mobile,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(150);

  return NextResponse.json({ ok: true, orders: rows });
}
