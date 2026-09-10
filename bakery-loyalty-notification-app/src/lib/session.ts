import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "yummy-bakes-dev-secret-change-in-production"
);

export const SESSION_COOKIE = "yb_session";
export const SESSION_DAYS = 7;

export type SessionPayload = {
  sub: string;
  name: string;
  mobile: string;
  role: "customer" | "admin";
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, mobile: payload.mobile, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(SECRET ? token : "", SECRET);
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      name: (payload.name as string) ?? "Baker",
      mobile: (payload.mobile as string) ?? "",
      role: (payload.role as "customer" | "admin") ?? "customer",
    };
  } catch {
    return null;
  }
}

/** Returns the session only for admins, else null. */
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}
