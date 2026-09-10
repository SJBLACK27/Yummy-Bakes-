import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, user: null });

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      role: users.role,
      pointsBalance: users.pointsBalance,
      totalOrders: users.totalOrders,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  if (!user) return NextResponse.json({ ok: true, user: null });
  return NextResponse.json({ ok: true, user });
}
