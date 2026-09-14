"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, QrCode, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./cart-provider";
import { inr } from "@/lib/utils";

export function CartDrawer() {
  const { open, setOpen, lines, total, add, decrement, remove } = useCart();
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cocoa/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ivory shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-cocoa/10 px-6 py-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-cocoa">
                <ShoppingBag className="size-5 text-caramel" /> Your basket
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-cocoa/10 text-bark transition hover:bg-sand"
                aria-label="Close cart"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag className="size-10 text-blush" />
                  <p className="mt-4 font-display text-lg font-semibold text-cocoa">
                    Your basket is empty
                  </p>
                  <p className="mt-1 max-w-56 text-sm text-bark/70">
                    Fresh bakes are waiting — add something warm.
                  </p>
                  <a
                    href="/#menu"
                    onClick={() => setOpen(false)}
                    className="mt-5 rounded-full bg-caramel px-5 py-2.5 text-sm font-bold text-ivory transition hover:bg-ember"
                  >
                    Browse the menu
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-cocoa/8">
                  {lines.map(({ product, qty }) => (
                    <li key={product.id} className="flex gap-4 py-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-cocoa">{product.name}</p>
                          <button
                            onClick={() => remove(product.id)}
                            className="text-bark/40 transition hover:text-ember"
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <p className="text-xs text-bark/60">{inr(product.price)} each</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-cocoa/15 p-1">
                            <button
                              onClick={() => decrement(product.id)}
                              className="grid size-6 place-items-center rounded-full text-bark transition hover:bg-sand"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <button
                              onClick={() => add(product.id)}
                              className="grid size-6 place-items-center rounded-full text-bark transition hover:bg-sand"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-extrabold text-cocoa">
                            {inr(product.price * qty)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-cocoa/10 bg-cream/60 px-6 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-bark/70">Subtotal</p>
                  <p className="font-display text-2xl font-bold text-cocoa">{inr(total)}</p>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-bark/60">
                  <QrCode className="size-3.5 text-caramel" />
                  Pay by scanning the dynamic QR generated at checkout.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/checkout");
                  }}
                  className="mt-4 w-full rounded-full bg-cocoa py-3.5 text-sm font-bold text-ivory transition hover:bg-bark"
                >
                  Proceed to checkout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
