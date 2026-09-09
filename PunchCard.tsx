"use client";

import { motion } from "framer-motion";
import { CakeSlice, Cherry, Cookie, Croissant, Dessert, Donut, Gift } from "lucide-react";
import clsx from "clsx";

const SLOT_ICONS = [Croissant, Donut, Cookie, Dessert, CakeSlice, Cherry, Croissant, Donut, Dessert, Gift];

/**
 * The loyalty punch card — 10 slots, the 10th is the free-bake milestone.
 */
export function PunchCard({ filled, pulse = false, dark = false }: { filled: number; pulse?: boolean; dark?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {SLOT_ICONS.map((Icon, i) => {
        const isFilled = i < filled;
        const isLast = i === 9;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={isFilled ? { scale: [0.6, 1.18, 1], rotate: [0, -8, 0] } : {}}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className={clsx(
              "relative grid aspect-square place-items-center rounded-2xl border transition-colors duration-300",
              isFilled
                ? "border-transparent bg-gradient-to-br from-caramel to-caramel-deep text-cream shadow-card"
                : dark
                  ? "border-dashed border-cream/25 bg-cream/5 text-cream/50"
                  : "border-dashed border-sand bg-cream-soft/60 text-cocoa/40",
              pulse && !isFilled && isLast && "animate-jam"
            )}
          >
            {isLast ? (
              isFilled ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                >
                  <Gift size={22} strokeWidth={2.2} />
                </motion.span>
              ) : (
                <span className="relative grid place-items-center">
                  <Gift size={22} strokeWidth={2.2} className="text-caramel" />
                  <span className="absolute inset-0 -m-2 rounded-2xl border-2 border-caramel/50 animate-ping" />
                </span>
              )
            ) : (
              <Icon size={22} strokeWidth={2.2} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
