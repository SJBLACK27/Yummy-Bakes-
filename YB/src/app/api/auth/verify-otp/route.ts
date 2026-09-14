import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type OtpPurpose } from "@/db/schema";
import { checkOtp } from "@/lib/otp";
import { createUserSession, signResetToken } from "@/lib/session";
import { normalizeMobile } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const purpose = body?.purpose as OtpPurpose;
    const mobile = normalizeMobile(String(body?.mobile ?? ""));
    const code = String(body?.code ?? "").trim();

    if (!mobile || !code) {
      return Response.json({ error: "Mobile number and OTP are required." }, { status: 400 });
    }

    const result = await checkOtp(mobile, purpose, code);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    if (purpose === "register") {
      const name = result.payload?.name?.trim();
      const passwordHash = result.payload?.passwordHash;
      if (!name || !passwordHash) {
        return Response.json(
          { error: "Registration session lost. Please start again." },
          { status: 400 },
        );
      }
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);

      let user = existing;
      if (existing && existing.passwordHash) {
        return Response.json(
          { error: "Account already exists. Please log in." },
          { status: 409 },
        );
      } else if (existing) {
        // Walk-in guest upgrading to a full account — keeps loyalty balance.
        const [updated] = await db
          .update(users)
          .set({ name, passwordHash })
          .where(eq(users.id, existing.id))
          .returning();
        user = updated;
      } else {
        const [created] = await db
          .insert(users)
          .values({ name, mobile, passwordHash })
          .returning();
        user = created;
      }

      await createUserSession({ uid: user.id, name: user.name, mobile: user.mobile });
      return Response.json({
        ok: true,
        user: { id: user.id, name: user.name, mobile: user.mobile },
      });
    }

    if (purpose === "login") {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.mobile, mobile))
        .limit(1);
      if (!user) {
        return Response.json({ error: "Account not found." }, { status: 404 });
      }
      await createUserSession({ uid: user.id, name: user.name, mobile: user.mobile });
      return Response.json({
        ok: true,
        user: { id: user.id, name: user.name, mobile: user.mobile },
      });
    }

    // purpose === "reset" → issue a short-lived, signed reset token.
    const resetToken = await signResetToken(mobile);
    return Response.json({ ok: true, resetToken });
  } catch (e) {
    console.error("verify-otp error", e);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
