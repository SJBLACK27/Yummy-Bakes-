/**
 * WhatsApp milestone alerts via Twilio.
 *
 * Configure these environment variables to send real messages:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_WHATSAPP_FROM   (e.g. whatsapp:+14155238886 — Twilio sandbox / approved sender)
 *   OWNER_WHATSAPP_NUMBER  (e.g. whatsapp:+919876543210 — bakery owner's phone)
 *
 * When credentials are absent we still compose the exact message and log it to
 * the notifications table with status "simulated", so the end-to-end loyalty
 * flow is fully visible in the admin panel.
 */

export type MilestonePayload = {
  customerName: string;
  customerMobile: string;
  totalOrders: number;
  pointsBalance: number;
  lastOrderSummary: string;
  lastOrderTotal: number;
  rewardTitle: string;
  recentOrders: Array<{ when: string; summary: string; amount: number }>;
};

const inr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export function buildMilestoneMessage(p: MilestonePayload): string {
  const lines: string[] = [
    "YUMMY BAKES — 10TH PURCHASE MILESTONE",
    "",
    `Customer: ${p.customerName}`,
    `Mobile: ${p.customerMobile}`,
    `Total Purchases: ${p.totalOrders}`,
    `Loyalty Points Balance: ${p.pointsBalance.toLocaleString("en-IN")} pts`,
    "",
    `Latest Order: ${p.lastOrderSummary} — ${inr(p.lastOrderTotal)}`,
  ];
  if (p.recentOrders.length > 0) {
    lines.push("", "Recent Orders:");
    for (const o of p.recentOrders) {
      lines.push(`- ${o.when}: ${o.summary} (${inr(o.amount)})`);
    }
  }
  lines.push(
    "",
    `Reward Triggered: ${p.rewardTitle}`,
    "",
    "Please call the customer to celebrate and arrange their special treat.",
    "— Yummy Bakes Loyalty Bot"
  );
  return lines.join("\n");
}

export type WhatsAppResult = {
  status: "sent" | "simulated" | "failed";
  body: string;
  to: string;
  error: string | null;
};

export async function sendOwnerMilestoneWhatsApp(
  p: MilestonePayload
): Promise<WhatsAppResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.OWNER_WHATSAPP_NUMBER ?? "+91XXXXXXXXXX";
  const body = buildMilestoneMessage(p);

  if (!sid || !token || !from || !process.env.OWNER_WHATSAPP_NUMBER) {
    return { status: "simulated", body, to, error: null };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    const wa = (n: string) => (n.startsWith("whatsapp:") ? n : `whatsapp:${n}`);
    await client.messages.create({ from: wa(from), to: wa(to), body });
    return { status: "sent", body, to, error: null };
  } catch (err) {
    return {
      status: "failed",
      body,
      to,
      error: err instanceof Error ? err.message : "Unknown Twilio error",
    };
  }
}
