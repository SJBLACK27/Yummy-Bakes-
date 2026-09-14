"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck, Gift, QrCode } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[4/3.4] overflow-hidden rounded-[2.5rem] border border-cocoa/10 shadow-soft"
      >
        <Image
          src="/images/hero.jpg"
          alt="Fresh bakes on a wooden table at Yummy Bakes"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/25 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-3 top-8 rounded-2xl border border-cocoa/10 bg-ivory/95 px-4 py-3 shadow-lift backdrop-blur sm:-left-6"
      >
        <p className="flex items-center gap-2 text-xs font-bold text-cocoa">
          <span className="grid size-7 place-items-center rounded-full bg-gold/25 text-ember">
            <Gift className="size-4" />
          </span>
          Every 5th order — FREE Cupcake Box
        </p>
        <p className="mt-1 pl-9 text-[11px] text-bark/60">Cycle repeats forever. No expiry.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-5 right-4 rounded-2xl border border-cocoa/10 bg-cocoa px-4 py-3 text-ivory shadow-lift sm:right-8"
      >
        <p className="flex items-center gap-2 text-xs font-bold">
          <QrCode className="size-4 text-gold" /> Scan-to-pay QR checkout
        </p>
        <p className="mt-1 flex items-center gap-1.5 pl-6 text-[11px] text-ivory/70">
          <BadgeCheck className="size-3.5 text-moss" /> Instant WhatsApp confirmation
        </p>
      </motion.div>
    </div>
  );
}
