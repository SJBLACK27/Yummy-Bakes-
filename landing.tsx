"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ChefHat,
  Cookie,
  Croissant,
  Gift,
  Heart,
  LogOut,
  MessageCircle,
  Phone,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Wheat,
  Menu as MenuIcon,
  X,
  LayoutDashboard,
} from "lucide-react";
import clsx from "clsx";
import { MENU } from "@/lib/menu";
import { inr } from "@/lib/format";
import { fetchMe, logout, type SessionUser } from "@/lib/client";
import { Logo } from "@/components/Logo";
import { PunchCard } from "@/components/PunchCard";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-cream text-espresso">
      <Nav />
      <Hero />
      <Marquee />
      <MenuSection />
      <LoyaltySection />
      <StorySection />
      <CtaBand />
      <Footer />
    </div>
  );
}

/* ---------------------------------- Nav ---------------------------------- */

function Nav() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  const links = [
    { href: "#menu", label: "The Menu" },
    { href: "#loyalty", label: "Rewards" },
    { href: "#story", label: "Our Story" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-sand/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Yummy Bakes home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-cocoa/80 transition hover:text-caramel-deep"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {me ? (
            <>
              {me.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-sand px-4 py-2 text-sm font-bold text-cocoa transition hover:border-caramel hover:bg-butter/50"
                >
                  <LayoutDashboard size={15} /> Owner Panel
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-sand px-4 py-2 text-sm font-bold text-cocoa transition hover:border-caramel hover:bg-butter/50"
                >
                  <Sparkles size={15} /> My Dashboard
                </Link>
              )}
              <button
                onClick={() => logout().then(() => location.reload())}
                className="grid h-9 w-9 place-items-center rounded-full text-cocoa/60 transition hover:bg-butter/70 hover:text-caramel-deep"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-bold text-cocoa transition hover:text-caramel-deep"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2.5 text-sm font-bold text-cream shadow-card transition hover:bg-caramel-deep"
              >
                Join the club
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-full md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-sand/60 bg-cream px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-cocoa hover:bg-butter/60"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={me ? (me.role === "admin" ? "/admin" : "/dashboard") : "/login"}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-espresso px-4 py-3 text-sm font-bold text-cream"
            >
              {me ? "Open my dashboard" : "Log in / Join"}
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------- Hero --------------------------------- */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative pt-28 lg:pt-36">
      <div className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-butter/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-64 h-96 w-96 rounded-full bg-butter/50 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
        <div className="relative z-10">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-sand bg-cream-soft px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-caramel-deep">
              <Wheat size={13} />
              Small-batch home bakery
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 font-display text-[clamp(2.9rem,6.4vw,5.2rem)] leading-[0.98] tracking-[-0.02em]"
          >
            Baked with love,
            <br />
            <span className="italic text-caramel-deep">rewarded</span> with joy.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-md text-lg leading-relaxed text-cocoa/80"
          >
            Order warm bakes straight from our home oven, earn a loyalty point on
            every purchase — and every{" "}
            <span className="font-bold text-espresso">10th order unlocks a free bake</span>,
            fresh and on the house.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/order"
              className="group inline-flex items-center gap-2.5 rounded-full bg-espresso px-7 py-3.5 text-sm font-bold text-cream shadow-warm transition-all hover:-translate-y-0.5 hover:bg-caramel-deep"
            >
              <ShoppingBag size={17} />
              Order &amp; start earning
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full border-2 border-espresso/15 px-7 py-3.5 text-sm font-bold text-espresso transition hover:border-caramel hover:bg-butter/50"
            >
              Peek the menu
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4"
          >
            {[
              { big: "2,400+", small: "orders baked with love" },
              { big: "4.9", small: "average slice rating", star: true },
              { big: "170+", small: "free bakes gifted" },
            ].map((s) => (
              <div key={s.big + s.small}>
                <div className="flex items-center gap-1.5 font-display text-2xl">
                  {s.big}
                  {s.star && <Star size={16} className="fill-caramel text-caramel" />}
                </div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-cocoa/60">
                  {s.small}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero visual */}
        <div className="relative mx-auto w-full max-w-[480px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-t-[999px] rounded-b-[40px] bg-butter" />
            <motion.div style={{ y: imgY }} className="grainy relative overflow-hidden rounded-t-[999px] rounded-b-[32px] shadow-warm">
              <Image
                src="/images/hero.jpg"
                alt="Fresh bakes from the Yummy Bakes oven"
                width={960}
                height={1200}
                priority
                className="h-[440px] w-full object-cover sm:h-[520px]"
              />
            </motion.div>
          </motion.div>

          {/* Floating loyalty card */}
          <motion.div
            style={{ y: cardY }}
            className="absolute -left-6 top-16 hidden sm:block"
          >
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="animate-float rounded-2xl border border-sand/70 bg-cream/95 p-4 shadow-warm backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-caramel to-caramel-deep text-cream">
                  <Cookie size={18} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">+1 point earned</p>
                  <p className="text-xs font-semibold text-cocoa/60">Every purchase = 1 stamp</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-sand/60">
                <motion.div
                  initial={{ width: "12%" }}
                  animate={{ width: "84%" }}
                  transition={{ delay: 1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-caramel to-caramel-deep"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Floating reward card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-4 bottom-10 animate-float-slow rounded-2xl bg-espresso p-4 text-cream shadow-warm sm:-right-8"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream/10 text-butter">
                <Gift size={18} />
              </span>
              <div>
                <p className="text-sm font-extrabold">10th order = FREE bake</p>
                <p className="text-xs font-medium text-cream/60">Punch card complete!</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Marquee -------------------------------- */

function Marquee() {
  const items = [
    "Every 10th order is free",
    "1 point for every purchase",
    "Baked at dawn, delivered warm",
    "Owner gets pinged on WhatsApp at every milestone",
  ];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-espresso/10 bg-espresso py-4 text-cream">
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-10 text-sm font-bold uppercase tracking-[0.18em]">
            {t}
            <Croissant size={16} className="text-caramel" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Menu --------------------------------- */

function MenuSection() {
  return (
    <section id="menu" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-caramel-deep"
          >
            Fresh from our oven today
          </motion.p>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={1}
            className="mt-3 font-display text-4xl sm:text-5xl"
          >
            Today&apos;s <span className="italic text-caramel-deep">yummeries</span>
          </motion.h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-cocoa/70">
          Every bake is made to order in our home kitchen — no preservatives,
          just butter, patience and a very warm oven.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {MENU.map((m, i) => (
          <motion.article
            key={m.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            custom={i % 4}
            className="group relative overflow-hidden rounded-3xl border border-sand/60 bg-white/60 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-warm"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={m.image}
                alt={m.name}
                width={640}
                height={480}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-caramel-deep backdrop-blur">
                {m.tag}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg leading-snug">{m.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-cocoa/70">
                {m.desc}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="font-display text-xl">{inr(m.price)}</span>
                  <span className="ml-1.5 text-[11px] font-bold text-leaf">
                    +1 stamp
                  </span>
                </div>
                <Link
                  href="/order"
                  className="inline-flex items-center gap-1.5 rounded-full bg-butter/70 px-4 py-2 text-xs font-extrabold text-espresso transition group-hover:bg-espresso group-hover:text-cream"
                >
                  Order
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Loyalty -------------------------------- */

function LoyaltySection() {
  const steps = [
    {
      icon: Smartphone,
      title: "Sign in with your mobile",
      desc: "No cards to carry, nothing to print. Your mobile number is your loyalty card — every order is tracked to it automatically.",
    },
    {
      icon: ShoppingBag,
      title: "Order & earn points",
      desc: "Every purchase fills one slot on your punch card and earns 1 loyalty point — automatically, the moment you place the order.",
    },
    {
      icon: Gift,
      title: "10th order = free bake",
      desc: "Every 10th purchase unlocks a FREE signature bake of your choice. We even ping our owner's WhatsApp instantly to celebrate your milestone.",
    },
  ];

  return (
    <section id="loyalty" className="scroll-mt-24 bg-cream-soft py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-caramel-deep"
          >
            The Yummy Club
          </motion.p>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            custom={1}
            className="mt-3 font-display text-4xl sm:text-5xl"
          >
            Loyalty that tastes like{" "}
            <span className="italic text-caramel-deep">warm butter</span>
          </motion.h2>

          <div className="mt-10 space-y-7">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                custom={i}
                className="flex gap-5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-espresso text-cream shadow-card">
                  <s.icon size={20} />
                </span>
                <div>
                  <h3 className="font-display text-xl">{s.title}</h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-cocoa/75">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-5 -z-10 rotate-2 rounded-[36px] bg-butter/70" />
          <div className="rounded-[32px] border border-sand/70 bg-white/80 p-7 shadow-warm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-caramel-deep">
                  Your punch card
                </p>
                <p className="mt-1 font-display text-2xl">7 of 10 orders</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-caramel to-caramel-deep text-cream">
                <Sparkles size={20} />
              </span>
            </div>
            <div className="mt-6">
              <PunchCard filled={7} pulse />
            </div>
            <p className="mt-6 rounded-2xl bg-cream-soft px-4 py-3 text-[13px] font-semibold leading-relaxed text-cocoa/80">
              3 more orders and this card turns golden — a FREE signature bake is
              all yours. Milestones are messaged to our owner on WhatsApp within
              seconds.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------- Story -------------------------------- */

function StorySection() {
  return (
    <section id="story" className="mx-auto grid max-w-6xl items-center gap-14 scroll-mt-24 px-5 py-24 lg:grid-cols-[0.9fr_1.1fr]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-md"
      >
        <div className="absolute -inset-4 -z-10 -rotate-3 rounded-[40px] bg-gradient-to-br from-butter to-sand/60" />
        <Image
          src="/images/baker.jpg"
          alt="Ritika, our home baker, kneading dough"
          width={800}
          height={1000}
          className="h-[420px] w-full rounded-[32px] object-cover shadow-warm sm:h-[500px]"
        />
        <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-espresso px-5 py-2.5 text-xs font-bold text-cream shadow-warm">
          <Heart size={14} className="fill-caramel text-caramel" />
          Baked by Ritika, since 2021
        </div>
      </motion.div>

      <div>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-caramel-deep"
        >
          Our story
        </motion.p>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={1}
          className="mt-3 font-display text-4xl leading-tight sm:text-5xl"
        >
          One tiny kitchen.
          <br />
          One very happy <span className="italic text-caramel-deep">neighbourhood</span>.
        </motion.h2>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={2}
          className="mt-6 max-w-lg space-y-4 text-[15px] leading-relaxed text-cocoa/80"
        >
          <p>
            What started as Sunday baking for friends turned into a tiny home
            bakery that now feeds half the lane. We ferment slow, frost
            gently, and never bake ahead — everything leaves the oven the same
            morning it reaches your door.
          </p>
          <p>
            The Yummy Club is our way of saying thank you: every order is
            remembered, every point is earned, and every tenth bake is back on
            us — like a little pastry hug.
          </p>
        </motion.div>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={3}
          className="mt-8 font-display text-2xl italic text-caramel-deep"
        >
          — Ritika, founder &amp; chief taste-tester
        </motion.p>
      </div>
    </section>
  );
}

/* ---------------------------------- CTA ---------------------------------- */

function CtaBand() {
  return (
    <section className="px-5 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="grainy relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-espresso px-8 py-16 text-center text-cream shadow-warm sm:py-20"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-caramel/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-caramel/20 blur-3xl" />
        <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-butter">
          <ChefHat size={14} />
          The oven is already warm
        </span>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
          Your first points are one{" "}
          <span className="italic text-caramel">croissant</span> away
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-cream/70">
          Join the Yummy Club, place your first order, and watch your punch card
          start filling up. Ten orders later, a free bake is waiting.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 rounded-full bg-caramel px-7 py-3.5 text-sm font-extrabold text-espresso transition hover:-translate-y-0.5 hover:bg-butter"
          >
            Join &amp; order now
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#menu"
            className="inline-flex items-center gap-2 rounded-full border-2 border-cream/25 px-7 py-3.5 text-sm font-bold text-cream transition hover:border-caramel"
          >
            Browse the bakes
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Footer -------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-espresso/10 bg-espresso text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo dark size="lg" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
            A small home kitchen with a big heart — and a loyalty club that
            remembers every single crumb you loved.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-butter">
            Visit &amp; order
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/70">
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="text-caramel" /> +91 98••• ••123 (call/WhatsApp)
            </li>
            <li className="flex items-center gap-2.5">
              <MessageCircle size={14} className="text-caramel" /> Orders open 7 AM – 9 PM
            </li>
            <li className="flex items-center gap-2.5">
              <Wheat size={14} className="text-caramel" /> Same-day delivery within 5 km
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-butter">
            The Yummy Club
          </h4>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            1 point per purchase. Every 10th order unlocks a free signature
            bake — and the owner hears about your milestone instantly on
            WhatsApp.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-6 text-center text-xs font-semibold text-cream/40">
        Yummy Bakes — handmade with butter, patience and love.
      </div>
    </footer>
  );
}
