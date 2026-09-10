import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["pending", "preparing", "ready", "delivered", "cancelled"]);

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!ALLOWED.has(status))
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });

  const [updated] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();

  if (!updated)
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

  return NextResponse.json({ ok: true, order: updated });
}
