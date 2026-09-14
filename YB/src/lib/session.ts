import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "yummy-bakes-dev-secret-change-in-production",
);

export const USER_COOKIE = "yb_session";
export const ADMIN_COOKIE = "yb_admin";

export interface UserSession {
  uid: number;
  name: string;
  mobile: string;
}

/* ------------------------------------------------------------ user session */

export async function createUserSession(payload: UserSession) {
  const token = await new SignJWT({ ...payload, scope: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const store = await cookies();
  store.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getUserSession(): Promise<UserSession | null> {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.scope !== "user") return null;
    return {
      uid: payload.uid as number,
      name: payload.name as string,
      mobile: payload.mobile as string,
    };
  } catch {
    return null;
  }
}

export async function clearUserSession() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

/* ----------------------------------------------------------- admin session */

export async function createAdminSession() {
  const token = await new SignJWT({ scope: "admin", sub: "YUMMY_BAKES" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.scope === "admin";
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/* ------------------------------------------- short-lived reset tokens (JWT) */

export async function signResetToken(mobile: string): Promise<string> {
  return new SignJWT({ mobile, scope: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SECRET);
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.scope !== "reset" || typeof payload.mobile !== "string")
      return null;
    return payload.mobile;
  } catch {
    return null;
  }
}
