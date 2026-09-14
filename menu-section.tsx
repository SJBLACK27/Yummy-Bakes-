"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { useCart } from "./cart-provider";
import { inr } from "@/lib/utils";

export function MenuSection() {
  const { qtyOf, add, decrement, setOpen } = useCart();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PRODUCTS.map((p, i) => {
        const qty = qtyOf(p.id);
        return (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: (i % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-cocoa/8 bg-ivory shadow-lift"
          >
            <div className="relative aspect-[5/4] overflow-hidden">
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-105"
              />
              {p.tag && (
                <span className="absolute left-3 top-3 rounded-full bg-cocoa/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold backdrop-blur">
                  {p.tag}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold leading-tight text-cocoa">
                  {p.name}
                </h3>
                <p className="shrink-0 font-display text-lg font-bold text-caramel">
                  {inr(p.price)}
                </p>
              </div>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-bark/70">
                {p.desc}
              </p>
              <div className="mt-4">
                {qty === 0 ? (
                  <button
                    onClick={() => add(p.id)}
                    className="w-full rounded-full border border-cocoa/15 py-2.5 text-sm font-bold text-cocoa transition hover:border-caramel hover:bg-caramel hover:text-ivory"
                  >
                    Add to basket
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 rounded-full border border-caramel bg-caramel/10 p-1">
                      <button
                        onClick={() => decrement(p.id)}
                        className="grid size-7 place-items-center rounded-full text-ember transition hover:bg-ivory"
                        aria-label="Decrease"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-extrabold text-cocoa">
                        {qty}
                      </span>
                      <button
                        onClick={() => add(p.id)}
                        className="grid size-7 place-items-center rounded-full text-ember transition hover:bg-ivory"
                        aria-label="Increase"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setOpen(true)}
                      className="rounded-full bg-cocoa px-4 py-2 text-xs font-bold text-ivory transition hover:bg-bark"
                    >
                      View basket
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
