import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/session";
import { AuthForm } from "./auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — Yummy Bakes" };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getUserSession();
  const { next } = await searchParams;
  if (session) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");

  return <AuthForm nextUrl={next && next.startsWith("/") && !next.startsWith("//") ? next : undefined} />;
}
