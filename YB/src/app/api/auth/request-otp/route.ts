import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { issueOtp } from "@/lib/otp";
import { normalizeMobile } from "@/lib/utils";
import type { OtpPurpose } from "@/db/schema";

const PURPOSES: OtpPurpose[] = ["register", "login", "reset"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const purpose = body?.purpose as OtpPurpose;
    const mobile = normalizeMobile(String(body?.mobile ?? ""));
    const name = String(body?.name ?? "").trim();
    const password = String(body?.password ?? "");

    if (!PURPOSES.includes(purpose)) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!mobile) {
      return Response.json(
        { error: "Enter a valid 10-digit mobile number." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);

    if (purpose === "register") {
      if (existing?.passwordHash) {
        return Response.json(
          { error: "An account already exists with this number. Please log in instead." },
          { status: 409 },
        );
      }
      if (name.length < 2) {
        return Response.json({ error: "Please enter your full name." }, { status: 400 });
      }
      if (password.length < 6) {
        return Response.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 },
        );
      }
      const passwordHash = await hashPassword(password);
      const result = await issueOtp(mobile, "register", { name, passwordHash });
      if (!result.ok) {
        return Response.json(
          { error: `Please wait ${result.retryAfter}s before resending.`, retryAfter: result.retryAfter },
          { status: 429 },
        );
      }
      return Response.json({
        ok: true,
        message: `OTP sent to +91 ${mobile}`,
        resendIn: result.resendIn,
        devOtp: result.devOtp,
      });
    }

    if (purpose === "login") {
      if (!existing || !existing.passwordHash) {
        return Response.json(
          { error: existing
              ? "This number has loyalty points but no password yet. Use Forgot Password to set one."
              : "No account found with this number. Please create an account." },
          { status: 404 },
        );
      }
      const valid = await verifyPassword(password, existing.passwordHash);
      if (!valid) {
        return Response.json({ error: "Incorrect password." }, { status: 401 });
      }
      const result = await issueOtp(mobile, "login");
      if (!result.ok) {
        return Response.json(
          { error: `Please wait ${result.retryAfter}s before resending.`, retryAfter: result.retryAfter },
          { status: 429 },
        );
      }
      return Response.json({
        ok: true,
        message: `OTP sent to +91 ${mobile}`,
        resendIn: result.resendIn,
        devOtp: result.devOtp,
      });
    }

    // purpose === "reset"
    if (!existing || !existing.passwordHash) {
      return Response.json(
        { error: "No registered account found with this mobile number." },
        { status: 404 },
      );
    }
    const result = await issueOtp(mobile, "reset");
    if (!result.ok) {
      return Response.json(
        { error: `Please wait ${result.retryAfter}s before resending.`, retryAfter: result.retryAfter },
        { status: 429 },
      );
    }
    return Response.json({
      ok: true,
      message: `Recovery OTP sent to +91 ${mobile}`,
      resendIn: result.resendIn,
      devOtp: result.devOtp,
    });
  } catch (e) {
    console.error("request-otp error", e);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
