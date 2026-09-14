"use client";

import Link from "next/link";
import { Croissant, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "./cart-provider";

export function SiteHeader({ authed, name }: { authed: boolean; name?: string }) {
  const { count, setOpen } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-ivory/80 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-caramel text-ivory shadow-lift">
            <Croissant className="size-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-cocoa">
            Yummy Bakes
          </span>
        </Link>

        <nav className="relative z-10 hidden items-center gap-7 text-sm font-semibold text-bark md:flex">
          <a href="#menu" className="transition hover:text-caramel">Menu</a>
          <a href="#loyalty" className="transition hover:text-caramel">Loyalty Circle</a>
          <a href="#story" className="transition hover:text-caramel">Our Story</a>
        </nav>

        <div className="relative z-10 flex items-center gap-2.5">
          <Link
            href={authed ? "/dashboard" : "/auth"}
            className="hidden items-center gap-2 rounded-full border border-cocoa/15 bg-ivory px-4 py-2 text-sm font-semibold text-cocoa transition hover:border-caramel hover:text-caramel sm:flex"
          >
            <UserRound className="size-4" />
            {authed ? (name?.split(" ")[0] ?? "Dashboard") : "Sign in"}
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-bark"
            aria-label="Open cart"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-extrabold text-cocoa">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
