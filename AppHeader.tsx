"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { logout, type SessionUser } from "@/lib/client";
import { Logo } from "@/components/Logo";

type NavItem = { href: string; label: string };

export function AppHeader({
  me,
  items,
  active,
}: {
  me: SessionUser | null;
  items: NavItem[];
  active: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toastFlush();
  }
  function toastFlush() {
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-sand/60 bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Yummy Bakes home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                active === it.href
                  ? "bg-espresso text-cream"
                  : "text-cocoa/70 hover:bg-butter/60 hover:text-espresso"
              )}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          {me && (
            <div className="hidden items-center gap-2.5 rounded-full border border-sand bg-white/60 py-1.5 pl-1.5 pr-4 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-caramel to-caramel-deep text-[11px] font-extrabold text-cream">
                {me.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-extrabold text-espresso">{me.name.split(" ")[0]}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            className="grid h-9 w-9 place-items-center rounded-full border border-sand text-cocoa/70 transition hover:bg-butter/70 hover:text-caramel-deep"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
      {/* Mobile nav row */}
      <div className="flex gap-1 overflow-x-auto border-t border-sand/40 px-5 py-2 sm:hidden">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={clsx(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              active === it.href ? "bg-espresso text-cream" : "text-cocoa/70"
            )}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-caramel to-caramel-deep text-cream shadow-warm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 11 3.704 4.266a1 1 0 0 0 1.592 0L16.5 11" />
            <path d="M12 2c-3.739 2.229-6.681 5.507-8.37 9.107a1.52 1.52 0 0 0 .7 2.02A12.427 12.427 0 0 0 12 14a12.427 12.427 0 0 0 7.67-.873 1.52 1.52 0 0 0 .7-2.02C18.681 7.507 15.74 4.229 12 2Z" />
          </svg>
        </span>
        <p className="text-sm font-bold text-cocoa/60">Warming up the oven...</p>
      </div>
    </div>
  );
}
