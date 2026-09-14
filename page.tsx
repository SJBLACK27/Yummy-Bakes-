import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Dashboard — Yummy Bakes" };

export default async function DashboardPage() {
  const session = await getUserSession();
  if (!session) redirect("/auth?next=/dashboard");
  return <DashboardClient session={session} />;
}
