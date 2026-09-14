import { clearUserSession } from "@/lib/session";

export async function POST() {
  await clearUserSession();
  return Response.json({ ok: true });
}
