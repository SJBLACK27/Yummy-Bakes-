import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, users, type DeliveryInfo, type OrderItem } from "@/db/schema";
import { getUserSession } from "@/lib/session";
import { findProduct, orderTotal } from "@/lib/products";
import { buildUpiUri, qrDataUrl } from "@/lib/qr";
import { DELIVERY_SLOTS, normalizeMobile, orderRef } from "@/lib/utils";

interface CartLineInput {
  productId: string;
  qty: number;
}

/** Create an online order in `payment_pending` state and mint a dynamic QR. */
export async function POST(req: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return Response.json({ error: "Please log in to place an order." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawItems = (body?.items ?? []) as CartLineInput[];
    const lines = rawItems
      .map((it) => ({
        product: findProduct(String(it.productId)),
        qty: Math.max(0, Math.min(10, Number(it.qty) || 0)),
      }))
      .filter((l) => l.product && l.qty > 0) as {
      product: NonNullable<ReturnType<typeof findProduct>>;
      qty: number;
    }[];

    if (lines.length === 0) {
      return Response.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const mode: DeliveryInfo["mode"] = body?.delivery?.mode === "pickup" ? "pickup" : "delivery";
    const address = String(body?.delivery?.address ?? "").trim();
    const contact = normalizeMobile(String(body?.delivery?.contact ?? ""));
    const slot = String(body?.delivery?.slot ?? "").trim();

    if (!contact) {
      return Response.json(
        { error: "Enter a valid 10-digit contact number for delivery updates." },
        { status: 400 },
      );
    }
    if (mode === "delivery" && address.length < 10) {
      return Response.json(
        { error: "Please enter your full delivery address." },
        { status: 400 },
      );
    }
    if (!DELIVERY_SLOTS.includes(slot) && slot.length < 4) {
      return Response.json({ error: "Please choose a delivery slot." }, { status: 400 });
    }

    const items: OrderItem[] = lines.map((l) => ({
      name: l.product.name,
      qty: l.qty,
      price: l.product.price,
    }));
    const total = orderTotal(lines.map((l) => ({ productId: l.product.id, qty: l.qty })));
    if (total <= 0) {
      return Response.json({ error: "Invalid order total." }, { status: 400 });
    }

    const [owner] = await db
      .select({ contactNumber: users.mobile })
      .from(users)
      .where(eq(users.id, session.uid));

    const [order] = await db
      .insert(orders)
      .values({
        userId: session.uid,
        kind: "online",
        items,
        totalAmount: total,
        paymentStatus: "pending",
        delivery: {
          mode,
          address: mode === "delivery" ? address : undefined,
          contact: contact || owner?.contactNumber || session.mobile,
          slot,
        },
      })
      .returning();

    const ref = orderRef(order.id);
    const upiUri = buildUpiUri(total, ref);
    const qr = await qrDataUrl(upiUri);

    return Response.json({
      ok: true,
      order: { id: order.id, ref, total, upiUri, qr },
    });
  } catch (e) {
    console.error("create order error", e);
    return Response.json({ error: "Could not create the order. Try again." }, { status: 500 });
  }
}
