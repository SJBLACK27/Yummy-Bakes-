import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rewards } from "@/db/schema";
import { getUserSession, isAdmin } from "@/lib/session";

/** Mark a reward as redeemed — allowed for the owning customer or the admin. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rewardId = Number(id);
  if (!Number.isInteger(rewardId)) {
    return Response.json({ error: "Invalid reward." }, { status: 400 });
  }

  const session = await getUserSession();
  const admin = await isAdmin();
  if (!session && !admin) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [reward] = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, rewardId))
    .limit(1);

  if (!reward) return Response.json({ error: "Reward not found." }, { status: 404 });
  if (!admin && reward.userId !== session?.uid) {
    return Response.json({ error: "Unauthorized." }, { status: 403 });
  }
  if (reward.status === "redeemed") {
    return Response.json({ ok: true, already: true });
  }

  await db
    .update(rewards)
    .set({ status: "redeemed", redeemedAt: new Date() })
    .where(eq(rewards.id, rewardId));

  return Response.json({ ok: true });
}
