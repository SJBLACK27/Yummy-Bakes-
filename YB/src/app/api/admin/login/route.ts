import { createAdminSession } from "@/lib/session";

// Server-only admin credentials (override via environment in production).
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "YUMMY_BAKES";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "YUMMY@123";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username ?? "");
    const password = String(body?.password ?? "");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return Response.json(
        { error: "Invalid admin credentials. Access denied." },
        { status: 401 },
      );
    }

    await createAdminSession();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("admin login error", e);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
