import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orders, rewards, users } from "@/db/schema";
import { getUserSession } from "@/lib/session";

/** Customer dashboard payload: profile + loyalty + orders + rewards + inbox. */
export async function GET() {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, session.uid));
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  const myRewards = await db
    .select()
    .from(rewards)
    .where(eq(rewards.userId, user.id))
    .orderBy(desc(rewards.awardedAt))
    .limit(20);

  const inbox = await db
    .select()
    .from(notifications)
    .where(eq(notifications.toNumber, user.mobile))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      points: user.loyaltyPoints,
      cycleCount: user.cycleCount,
      memberSince: user.createdAt,
    },
    orders: myOrders,
    rewards: myRewards,
    inbox,
  });
}
