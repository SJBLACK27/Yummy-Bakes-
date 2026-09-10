import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

export const dynamic = "force-dynamic";

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mobile = String(body.mobile ?? "").replace(/\D/g, "").slice(-10);
    const password = String(body.password ?? "");

    if (!mobile || !password)
      return fail("Enter your mobile number and password.");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash))
      return fail("Incorrect mobile number or password.", 401);

    const token = await createSessionToken({
      sub: user.id,
      name: user.name,
      mobile: user.mobile,
      role: user.role as "customer" | "admin",
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
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
