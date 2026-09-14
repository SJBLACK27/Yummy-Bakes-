import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ types */

export type OrderItem = { name: string; qty: number; price: number };

export type DeliveryInfo = {
  mode: "delivery" | "pickup";
  address?: string;
  contact: string;
  slot: string;
};

export type OtpPurpose = "register" | "login" | "reset";

export type OtpPayload = {
  name?: string;
  passwordHash?: string;
};

export type NotificationKind =
  | "otp"
  | "offline_purchase"
  | "online_order"
  | "milestone_owner"
  | "system";

export type NotificationChannel = "sms" | "whatsapp";

/* ----------------------------------------------------------------- tables */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    /** Null for walk-in guests created by admin POS until they register. */
    passwordHash: text("password_hash"),
    loyaltyPoints: integer("loyalty_points").notNull().default(0),
    /** Purchases completed in the current 5-order reward cycle (0-4). */
    cycleCount: integer("cycle_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_mobile_unique").on(t.mobile)],
);

export const otps = pgTable(
  "otps",
  {
    id: serial("id").primaryKey(),
    mobile: text("mobile").notNull(),
    code: text("code").notNull(),
    purpose: text("purpose").notNull().$type<OtpPurpose>(),
    /** Pending registration data (name + hashed password) held until verify. */
    payload: jsonb("payload").$type<OtpPayload>(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("otps_mobile_purpose_idx").on(t.mobile, t.purpose)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    /** online (customer checkout) | offline (admin POS walk-in) */
    kind: text("kind").notNull().$type<"online" | "offline">(),
    items: jsonb("items").notNull().$type<OrderItem[]>(),
    totalAmount: integer("total_amount").notNull(),
    /** pending | verified | paid-in-store */
    paymentStatus: text("payment_status").notNull(),
    paymentRef: text("payment_ref"),
    delivery: jsonb("delivery").$type<DeliveryInfo>(),
    loyaltyPointEarned: integer("loyalty_point_earned").notNull().default(0),
    milestoneHit: boolean("milestone_hit").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId)],
);

export const rewards = pgTable(
  "rewards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    title: text("title").notNull(),
    /** active | redeemed */
    status: text("status").notNull().default("active"),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  },
  (t) => [index("rewards_user_idx").on(t.userId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    channel: text("channel").notNull().$type<NotificationChannel>(),
    toNumber: text("to_number").notNull(),
    toLabel: text("to_label"),
    userId: integer("user_id"),
    kind: text("kind").notNull().$type<NotificationKind>(),
    body: text("body").notNull(),
    /** simulated (demo gateway) | sent | failed */
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notifications_to_idx").on(t.toNumber)],
);

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
