import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Restricted Access",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <AdminLoginForm />;
}
