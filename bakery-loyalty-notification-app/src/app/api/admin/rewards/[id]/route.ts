import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — mark a customer's reward as redeemed (or re-open it). */
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = body.status === "redeemed" ? "redeemed" : "available";

  const [updated] = await db
    .update(rewards)
    .set(
      status === "redeemed"
        ? { status, redeemedAt: new Date() }
        : { status, redeemedAt: null }
    )
    .where(eq(rewards.id, id))
    .returning();

  if (!updated)
    return NextResponse.json({ ok: false, error: "Reward not found." }, { status: 404 });

  return NextResponse.json({ ok: true, reward: updated });
}
