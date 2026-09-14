import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout — Yummy Bakes" };

export default async function CheckoutPage() {
  const session = await getUserSession();
  if (!session) redirect("/auth?next=/checkout");
  return <CheckoutClient session={session} />;
}
