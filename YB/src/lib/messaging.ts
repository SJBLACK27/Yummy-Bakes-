import { db } from "@/db";
import {
  notifications,
  type DeliveryInfo,
  type NotificationChannel,
  type NotificationKind,
  type OrderItem,
} from "@/db/schema";
import { displayMobile, inr, orderRef, CYCLE_LENGTH, REWARD_TITLE } from "./utils";

/**
 * Dual-channel notification service.
 *
 * Delivery behaviour:
 *  - If Twilio credentials are configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *    TWILIO_SMS_FROM / TWILIO_WHATSAPP_FROM) messages are dispatched through the
 *    real SMS + WhatsApp Business pipeline.
 *  - Otherwise every message is written to the `notifications` ledger with
 *    status "simulated", powering the demo SMS/WhatsApp inbox visible in the
 *    customer dashboard and the admin gateway log. OTP codes are also surfaced
 *    to the client in demo mode so flows remain fully testable.
 */

async function twilioSend(
  channel: NotificationChannel,
  to: string,
  body: string,
): Promise<boolean | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from =
    channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM
      : process.env.TWILIO_SMS_FROM;
  if (!sid || !token || !from) return null;

  try {
    const params = new URLSearchParams();
    const toNum = to.startsWith("+") ? to : `+${to}`;
    params.set(
      "From",
      channel === "whatsapp"
        ? `whatsapp:${from.startsWith("+") ? from : `+${from}`}`
        : from,
    );
    params.set("To", channel === "whatsapp" ? `whatsapp:${toNum}` : toNum);
    params.set("Body", body);
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

interface DeliverArgs {
  channel: NotificationChannel;
  to: string;
  body: string;
  kind: NotificationKind;
  toLabel?: string;
  userId?: number;
}

async function deliver(a: DeliverArgs): Promise<{ simulated: boolean }> {
  const live = await twilioSend(a.channel, a.to, a.body);
  const status = live === null ? "simulated" : live ? "sent" : "failed";
  try {
    await db.insert(notifications).values({
      channel: a.channel,
      toNumber: a.to,
      toLabel: a.toLabel ?? null,
      userId: a.userId ?? null,
      kind: a.kind,
      body: a.body,
      status,
    });
  } catch {
    // Never let the ledger kill the business flow.
  }
  return { simulated: live === null };
}

export function gatewayIsLive(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_SMS_FROM || process.env.TWILIO_WHATSAPP_FROM),
  );
}

export async function sendSms(args: Omit<DeliverArgs, "channel">) {
  return deliver({ ...args, channel: "sms" });
}

export async function sendWhatsApp(args: Omit<DeliverArgs, "channel">) {
  return deliver({ ...args, channel: "whatsapp" });
}

/* ------------------------------------------------------------- templates */

export function tplOtp(code: string): string {
  return `Yummy Bakes: Your verification OTP is ${code}. It is valid for 10 minutes. Do not share it with anyone.`;
}

export function tplOfflinePurchase(args: {
  name: string;
  amount: number;
  points: number;
  cycleCount: number;
  milestone: boolean;
}): string {
  const lines = [
    `Thanks for your purchase at Yummy Bakes, ${args.name}!`,
    `Bill value: ${inr(args.amount)}`,
    `Payment status: Paid via in-store QR scanner — Verified`,
    `Loyalty points earned: +1 (Lifetime points: ${args.points})`,
  ];
  if (args.milestone) {
    lines.push(
      `MILESTONE UNLOCKED: You completed your 5th purchase! Reward: ${REWARD_TITLE} on your next visit.`,
      `Your reward cycle counter has reset — the next purchase counts as 1/${CYCLE_LENGTH} of a brand new cycle.`,
    );
  } else {
    const left = CYCLE_LENGTH - args.cycleCount;
    lines.push(
      `Cycle status: ${args.cycleCount}/${CYCLE_LENGTH} — ${left} more purchase${left === 1 ? "" : "s"} to unlock your ${REWARD_TITLE}.`,
    );
  }
  lines.push("Baked with love — Yummy Bakes Home Bakery");
  return lines.join("\n");
}

export function tplOnlineOrder(args: {
  name: string;
  orderId: number;
  items: OrderItem[];
  total: number;
  paymentRef: string;
  delivery: DeliveryInfo;
  points: number;
  cycleCount: number;
  milestone: boolean;
}): string {
  const itemsText = args.items
    .map((i) => `${i.name} x${i.qty} (${inr(i.price * i.qty)})`)
    .join(", ");
  const deliveryLine =
    args.delivery.mode === "pickup"
      ? `Store pickup | Contact: ${displayMobile(args.delivery.contact)} | Slot: ${args.delivery.slot}`
      : `Home delivery to: ${args.delivery.address} | Contact: ${displayMobile(args.delivery.contact)} | Slot: ${args.delivery.slot}`;
  const lines = [
    `ORDER CONFIRMED — Yummy Bakes`,
    `Order: ${orderRef(args.orderId)}`,
    `Customer: ${args.name}`,
    `Items: ${itemsText}`,
    `Bill total: ${inr(args.total)}`,
    `Payment status: Paid via QR — Verified (Ref: ${args.paymentRef})`,
    `Delivery details: ${deliveryLine}`,
    `Loyalty points earned: +1 (Lifetime points: ${args.points})`,
  ];
  if (args.milestone) {
    lines.push(
      `MILESTONE UNLOCKED: This was your 5th purchase! Reward: ${REWARD_TITLE} — we'll pack it with this order.`,
      `Cycle counter reset — your next order starts the new cycle at 1/${CYCLE_LENGTH}.`,
    );
  } else {
    const left = CYCLE_LENGTH - args.cycleCount;
    lines.push(
      `Cycle status: ${args.cycleCount}/${CYCLE_LENGTH} — ${left} more order${left === 1 ? "" : "s"} to unlock your ${REWARD_TITLE}.`,
    );
  }
  lines.push("Thank you for ordering from Yummy Bakes!");
  return lines.join("\n");
}

export function tplOwnerMilestone(args: {
  name: string;
  mobile: string;
  ordersCount: number;
  lifetimeSpend: number;
  lastAmount: number;
  channel: "online" | "offline";
}): string {
  return [
    `LOYALTY MILESTONE ALERT — Yummy Bakes`,
    `Customer ${args.name} (${displayMobile(args.mobile)}) just completed their 5th purchase (${args.channel}).`,
    `Order history: ${args.ordersCount} orders | Lifetime spend: ${inr(args.lifetimeSpend)} | Last bill: ${inr(args.lastAmount)}`,
    `Reward unlocked for customer: ${REWARD_TITLE}`,
    `Cycle counter auto-reset — their next purchase counts as 1/${CYCLE_LENGTH}. Please honour the reward promptly.`,
  ].join("\n");
}
