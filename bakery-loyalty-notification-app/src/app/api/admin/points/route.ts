import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** POST — manually credit (or debit) loyalty points for a customer. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const delta = Math.trunc(Number(body.points) || 0);
  if (!userId || delta === 0 || Math.abs(delta) > 10000)
    return NextResponse.json(
      { ok: false, error: "Provide a customer and a non-zero points amount." },
      { status: 400 }
    );

  try {
    const updated = await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (!user) return null;
      const pointsBalance = Math.max(0, user.pointsBalance + delta);
      const [u] = await tx
        .update(users)
        .set({ pointsBalance })
        .where(eq(users.id, user.id))
        .returning({
          id: users.id,
          name: users.name,
          pointsBalance: users.pointsBalance,
        });
      return u;
    });

    if (!updated)
      return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });

    return NextResponse.json({ ok: true, customer: updated });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not update points. Try again." },
      { status: 500 }
    );
  }
}
