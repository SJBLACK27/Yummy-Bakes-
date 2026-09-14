import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { otps, type OtpPayload, type OtpPurpose } from "@/db/schema";
import { sendSms, tplOtp } from "./messaging";

export const RESEND_SECONDS = 30;
const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type IssueResult =
  | { ok: true; resendIn: number; devOtp?: string }
  | { ok: false; retryAfter: number };

/**
 * Issue an OTP for a mobile + purpose. Enforces a strict 30-second resend
 * cooldown. Any previous OTP for the same mobile+purpose is invalidated.
 * When the SMS gateway is running in demo mode, the code is returned so the
 * UI can surface it in a "simulated SMS" card.
 */
export async function issueOtp(
  mobile: string,
  purpose: OtpPurpose,
  payload?: OtpPayload,
): Promise<IssueResult> {
  const [latest] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.mobile, mobile), eq(otps.purpose, purpose)))
    .orderBy(desc(otps.createdAt))
    .limit(1);

  if (latest) {
    const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_SECONDS) {
      return { ok: false, retryAfter: Math.ceil(RESEND_SECONDS - elapsed) };
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db
    .delete(otps)
    .where(and(eq(otps.mobile, mobile), eq(otps.purpose, purpose)));
  await db.insert(otps).values({
    mobile,
    code,
    purpose,
    payload: payload ?? null,
    attempts: 0,
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
  });

  const { simulated } = await sendSms({
    to: mobile,
    body: tplOtp(code),
    kind: "otp",
  });

  return { ok: true, resendIn: RESEND_SECONDS, devOtp: simulated ? code : undefined };
}

export type CheckResult =
  | { ok: true; payload: OtpPayload | null }
  | { ok: false; error: string };

/** Verify an OTP. Explicit "Invalid OTP" error on mismatch. Max 5 attempts. */
export async function checkOtp(
  mobile: string,
  purpose: OtpPurpose,
  code: string,
): Promise<CheckResult> {
  const [row] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.mobile, mobile), eq(otps.purpose, purpose)))
    .orderBy(desc(otps.createdAt))
    .limit(1);

  if (!row) {
    return { ok: false, error: "No OTP found for this number. Please request a new one." };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(otps).where(eq(otps.id, row.id));
    return { ok: false, error: "OTP expired. Please tap resend to get a new code." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await db.delete(otps).where(eq(otps.id, row.id));
    return { ok: false, error: "Too many attempts. Please request a new OTP." };
  }
  if (row.code !== code.trim()) {
    await db
      .update(otps)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otps.id, row.id));
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      error: left > 0 ? `Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} left.` : "Invalid OTP.",
    };
  }
  await db.delete(otps).where(eq(otps.id, row.id));
  return { ok: true, payload: row.payload };
}
