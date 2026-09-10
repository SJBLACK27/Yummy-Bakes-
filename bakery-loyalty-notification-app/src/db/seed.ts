/**
 * Seed script — demo data for Yummy Bakes.
 * Run with:  npx tsx src/db/seed.ts
 *
 * Creates:
 *  - An admin (bakery owner) account
 *  - Three customers with realistic order history & loyalty points
 *    (Aarav sits at 9 orders — his NEXT order triggers the 10th-purchase
 *     reward + WhatsApp alert, perfect for a live demo)
 *  - A redeemed reward + a logged (simulated) WhatsApp notification sample
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  orders,
  rewards,
  notifications,
  type OrderLineItem,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { MENU, POINTS_PER_ORDER, REWARD_DESCRIPTION, REWARD_TITLE } from "@/lib/menu";
import { buildMilestoneMessage } from "@/lib/whatsapp";
import { summarizeItems } from "@/lib/format";

const item = (id: string, qty: number): OrderLineItem => {
  const m = MENU.find((x) => x.id === id);
  if (!m) throw new Error(`Menu item not found: ${id}`);
  return { name: m.name, price: m.price, qty };
};

function daysAgo(n: number, hour = 11): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 20, 0, 0);
  return d;
}

type SeedOrder = { items: OrderLineItem[]; status: string; daysBack: number };

async function seedCustomer(
  name: string,
  mobile: string,
  password: string,
  seedOrders: SeedOrder[],
  joinedDaysBack: number
) {
  const [user] = await db
    .insert(users)
    .values({ name, mobile, passwordHash: hashPassword(password), role: "customer" })
    .returning();

  let points = 0;
  const insertedOrders: Array<{ id: string; purchaseNumber: number; createdAt: Date; totalAmount: number; items: OrderLineItem[] }> = [];

  for (let i = 0; i < seedOrders.length; i++) {
    const s = seedOrders[i];
    const totalAmount = s.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const pointsEarned = POINTS_PER_ORDER;
    points += pointsEarned;
    const createdAt = daysAgo(s.daysBack, 10 + (i % 8));
    const [row] = await db
      .insert(orders)
      .values({
        userId: user.id,
        items: s.items,
        totalAmount,
        pointsEarned,
        purchaseNumber: i + 1,
        status: s.status,
        createdAt,
      })
      .returning();
    insertedOrders.push({ id: row.id, purchaseNumber: i + 1, createdAt, totalAmount, items: s.items });
  }

  await db
    .update(users)
    .set({ totalOrders: seedOrders.length, pointsBalance: points })
    .where(eq(users.id, user.id));

  return { user, points, insertedOrders };
}

async function main() {
  console.log("Seeding Yummy Bakes...");

  // Clean slate (order matters for FKs)
  await db.delete(notifications);
  await db.delete(rewards);
  await db.delete(orders);
  await db.delete(users);

  // ----- Admin / bakery owner -----
  await db.insert(users).values({
    name: "Ritika Kapoor",
    mobile: "9009009009",
    passwordHash: hashPassword("owner123"),
    role: "admin",
  });

  // ----- Aarav: 9 orders — the NEXT order hits the 10th-purchase milestone -----
  const aaravOrders: SeedOrder[] = [
    { items: [item("croissant", 3)], status: "delivered", daysBack: 61 },
    { items: [item("sourdough", 1), item("cookies", 1)], status: "delivered", daysBack: 55 },
    { items: [item("cupcakes", 1)], status: "delivered", daysBack: 47 },
    { items: [item("brownies", 2)], status: "delivered", daysBack: 39 },
    { items: [item("cinnamon-rolls", 1)], status: "delivered", daysBack: 32 },
    { items: [item("cake", 1)], status: "delivered", daysBack: 24 },
    { items: [item("croissant", 2), item("cheesecake", 1)], status: "delivered", daysBack: 16 },
    { items: [item("cookies", 2)], status: "delivered", daysBack: 8 },
    { items: [item("sourdough", 1), item("brownies", 1)], status: "preparing", daysBack: 1 },
  ];
  const aarav = await seedCustomer("Aarav Mehta", "9876543210", "yummy123", aaravOrders, 68);

  // ----- Diya: 3 orders -----
  const diyaOrders: SeedOrder[] = [
    { items: [item("cupcakes", 1)], status: "delivered", daysBack: 21 },
    { items: [item("cinnamon-rolls", 2)], status: "delivered", daysBack: 12 },
    { items: [item("cheesecake", 2)], status: "ready", daysBack: 0 },
  ];
  await seedCustomer("Diya Sharma", "9812345678", "yummy123", diyaOrders, 42);

  // ----- Kabir: 17 orders — redeemed the 10th-purchase reward already -----
  const patterns: OrderLineItem[][] = [
    [item("croissant", 2)],
    [item("cake", 1), item("cupcakes", 1)],
    [item("cookies", 3)],
    [item("sourdough", 2), item("brownies", 1)],
    [item("cinnamon-rolls", 1), item("croissant", 4)],
    [item("cheesecake", 2), item("brownies", 1)],
    [item("cupcakes", 2)],
  ];
  const kabirOrders: SeedOrder[] = Array.from({ length: 17 }, (_, i) => ({
    items: patterns[i % patterns.length],
    status: i === 16 ? "pending" : i === 15 ? "ready" : "delivered",
    daysBack: 58 - i * 3,
  }));
  const kabir = await seedCustomer("Kabir Rao", "9822223333", "yummy123", kabirOrders, 70);

  // Redeemed reward for Kabir's 10th purchase + its WhatsApp log
  const tenth = kabir.insertedOrders[9];
  if (tenth) {
    await db.insert(rewards).values({
      userId: kabir.user.id,
      orderId: tenth.id,
      purchaseNumber: 10,
      title: REWARD_TITLE,
      description: REWARD_DESCRIPTION,
      status: "redeemed",
      createdAt: tenth.createdAt,
      redeemedAt: daysAgo(20, 18),
    });

    const history = kabir.insertedOrders
      .slice(5, 9)
      .map((o) => ({
        when: o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        summary: summarizeItems(o.items),
        amount: o.totalAmount,
      }));
    const body = buildMilestoneMessage({
      customerName: "Kabir Rao",
      customerMobile: "9822223333",
      totalOrders: 10,
      pointsBalance: 10, // 1 point per purchase — 10 stamps after the 10th order
      lastOrderSummary: summarizeItems(tenth.items),
      lastOrderTotal: tenth.totalAmount,
      rewardTitle: REWARD_TITLE,
      recentOrders: history,
    });
    await db.insert(notifications).values({
      orderId: tenth.id,
      userId: kabir.user.id,
      toNumber: process.env.OWNER_WHATSAPP_NUMBER ?? "+91XXXXXXXXXX",
      body,
      status: "simulated",
      createdAt: tenth.createdAt,
    });
  }

  console.log("Seed complete.");
  console.log("  Admin login    → mobile 9009009009 / password owner123");
  console.log("  Demo customer  → mobile 9876543210 / password yummy123 (9 orders — next is the 10th!)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
