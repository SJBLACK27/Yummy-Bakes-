import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards } from "@/db/schema";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const [updated] = await db
    .update(rewards)
    .set({ status: "redeemed", redeemedAt: new Date() })
    .where(
      and(
        eq(rewards.id, id),
        eq(rewards.userId, session.sub),
        eq(rewards.status, "available")
      )
    )
    .returning();

  if (!updated)
    return NextResponse.json(
      { ok: false, error: "Reward not found or already redeemed." },
      { status: 404 }
    );

  return NextResponse.json({ ok: true, reward: updated });
}
