import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { verifyResetToken } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const resetToken = String(body?.resetToken ?? "");
    const password = String(body?.password ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");

    if (!resetToken) {
      return Response.json({ error: "Session expired. Please verify OTP again." }, { status: 401 });
    }
    if (password.length < 6) {
      return Response.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return Response.json(
        { error: "Passwords do not match. Please re-enter." },
        { status: 400 },
      );
    }

    const mobile = await verifyResetToken(resetToken);
    if (!mobile) {
      return Response.json(
        { error: "Reset session expired. Please start the recovery again." },
        { status: 401 },
      );
    }

    const passwordHash = await hashPassword(password);
    const [updated] = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.mobile, mobile))
      .returning();

    if (!updated) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    return Response.json({ ok: true, message: "Password updated successfully. Please log in." });
  } catch (e) {
    console.error("reset-password error", e);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
