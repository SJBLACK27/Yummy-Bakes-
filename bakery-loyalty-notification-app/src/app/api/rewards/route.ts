import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards } from "@/db/schema";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(rewards)
    .where(eq(rewards.userId, session.sub))
    .orderBy(desc(rewards.createdAt))
    .limit(50);

  return NextResponse.json({ ok: true, rewards: rows });
}
