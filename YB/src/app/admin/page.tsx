import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Dashboard — Yummy Bakes",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminClient />;
}
