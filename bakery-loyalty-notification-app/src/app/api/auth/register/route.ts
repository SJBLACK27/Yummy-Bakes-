import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

export const dynamic = "force-dynamic";

const MOBILE_RE = /^[6-9]\d{9}$/;

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const mobile = String(body.mobile ?? "").replace(/\D/g, "").slice(-10);
    const password = String(body.password ?? "");

    if (name.length < 2) return fail("Please tell us your name.");
    if (!MOBILE_RE.test(mobile))
      return fail("Enter a valid 10-digit Indian mobile number.");
    if (password.length < 6)
      return fail("Password must be at least 6 characters.");

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);
    if (existing)
      return fail("This mobile number is already registered — log in instead.", 409);

    const [user] = await db
      .insert(users)
      .values({ name, mobile, passwordHash: hashPassword(password), role: "customer" })
      .returning();

    const token = await createSessionToken({
      sub: user.id,
      name: user.name,
      mobile: user.mobile,
      role: "customer",
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 86400,
    });
    return res;
  } catch {
    return fail("Something went wrong in the kitchen. Please try again.", 500);
  }
}
