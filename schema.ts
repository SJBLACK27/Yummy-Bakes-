import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export type OrderLineItem = {
  name: string;
  price: number;
  qty: number;
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** "customer" | "admin" */
  role: varchar("role", { length: 12 }).notNull().default("customer"),
  pointsBalance: integer("points_balance").notNull().default(0),
  totalOrders: integer("total_orders").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    items: jsonb("items").$type<OrderLineItem[]>().notNull(),
    totalAmount: integer("total_amount").notNull(),
    pointsEarned: integer("points_earned").notNull().default(0),
    /** Which lifetime purchase this order represents for the customer */
    purchaseNumber: integer("purchase_number").notNull(),
    note: text("note"),
    /** pending | preparing | ready | delivered | cancelled */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId)]
);

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    purchaseNumber: integer("purchase_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    /** available | redeemed */
    status: varchar("status", { length: 12 }).notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  },
  (t) => [index("rewards_user_idx").on(t.userId)]
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  toNumber: text("to_number").notNull(),
  body: text("body").notNull(),
  /** sent | simulated | failed */
  status: varchar("status", { length: 12 }).notNull(),
  provider: varchar("provider", { length: 20 }).notNull().default("twilio"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type NotificationLog = typeof notifications.$inferSelect;
