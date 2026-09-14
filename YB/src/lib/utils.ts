/** Normalize an Indian mobile input to a bare 10-digit string. Returns null if invalid. */
export function normalizeMobile(input: string): string | null {
  const digits = String(input || "").replace(/\D/g, "");
  let m = digits;
  if (m.length === 12 && m.startsWith("91")) m = m.slice(2);
  if (m.length === 11 && m.startsWith("0")) m = m.slice(1);
  if (!/^[6-9]\d{9}$/.test(m)) return null;
  return m;
}

export function displayMobile(mobile: string): string {
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

export function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function orderRef(id: number): string {
  return `YB-${String(id).padStart(4, "0")}`;
}

export const DELIVERY_SLOTS = [
  "Today, 4:00 – 6:00 PM",
  "Today, 6:00 – 8:00 PM",
  "Tomorrow, 8:00 – 10:00 AM",
  "Tomorrow, 4:00 – 6:00 PM",
];

export const CYCLE_LENGTH = 5;
export const REWARD_TITLE = "FREE Signature Cupcake Box (4 pc)";

export function cycleMessage(cycleCount: number, milestone: boolean): string {
  if (milestone) {
    return `Milestone reached! Reward unlocked: ${REWARD_TITLE}. Your purchase counter has reset — your next purchase counts as 1/${CYCLE_LENGTH} in the new cycle.`;
  }
  const left = CYCLE_LENGTH - cycleCount;
  return `Cycle status: ${cycleCount}/${CYCLE_LENGTH} — ${left} more purchase${left === 1 ? "" : "s"} to unlock your ${REWARD_TITLE}.`;
}
