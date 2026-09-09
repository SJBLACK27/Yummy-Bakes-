import type { OrderLineItem } from "@/db/schema";

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function summarizeItems(items: OrderLineItem[]): string {
  return items
    .map((i) => (i.qty > 1 ? `${i.qty}× ${i.name}` : i.name))
    .join(" + ");
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
