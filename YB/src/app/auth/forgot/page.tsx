import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { ForgotForm } from "./forgot-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recover password — Yummy Bakes" };

export default async function ForgotPage() {
  const session = await getUserSession();
  if (session) redirect("/dashboard");
  return <ForgotForm />;
}
