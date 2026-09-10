"use client";

export type SessionUser = {
  id: string;
  name: string;
  mobile: string;
  role: "customer" | "admin";
  pointsBalance?: number;
  totalOrders?: number;
};

export type OrderLineItemClient = { name: string; price: number; qty: number };

export type ClientOrder = {
  id: string;
  items: OrderLineItemClient[];
  totalAmount: number;
  pointsEarned: number;
  purchaseNumber: number;
  note: string | null;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: string;
  customerName?: string;
  customerMobile?: string;
};

export type ClientReward = {
  id: string;
  userId?: string;
  purchaseNumber: number;
  title: string;
  description: string;
  status: "available" | "redeemed";
  createdAt: string;
  redeemedAt: string | null;
  customerName?: string;
  customerMobile?: string;
};

export type ClientCustomer = {
  id: string;
  name: string;
  mobile: string;
  pointsBalance: number;
  totalOrders: number;
  createdAt: string;
  availableRewards: number;
};

export type ClientNotification = {
  id: string;
  toNumber: string;
  body: string;
  status: "sent" | "simulated" | "failed";
  provider: string;
  error: string | null;
  createdAt: string;
  customerName: string | null;
  customerMobile: string | null;
};

async function parse<T>(res: Response): Promise<T & { ok: boolean; error?: string }> {
  const data = await res.json().catch(() => ({}));
  return { ...data, ok: res.ok && data.ok !== false };
}

export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function login(mobile: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, password }),
  });
  return parse<{ user: SessionUser }>(res);
}

export async function register(name: string, mobile: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mobile, password }),
  });
  return parse<{ user: SessionUser }>(res);
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function post<T>(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res);
}

export async function patch<T>(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export async function get<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return parse<T>(res);
}
