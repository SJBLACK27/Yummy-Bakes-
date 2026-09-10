import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: notifications.id,
      toNumber: notifications.toNumber,
      body: notifications.body,
      status: notifications.status,
      provider: notifications.provider,
      error: notifications.error,
      createdAt: notifications.createdAt,
      customerName: users.name,
      customerMobile: users.mobile,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(60);

  return NextResponse.json({ ok: true, notifications: rows });
}
