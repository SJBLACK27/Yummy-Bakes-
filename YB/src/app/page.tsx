import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Clock3,
  Gift,
  MapPin,
  Phone,
  QrCode,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Wheat,
} from "lucide-react";
import { CartDrawer } from "@/components/cart-drawer";
import { HeroVisual } from "@/components/hero-visual";
import { MenuSection } from "@/components/menu-section";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";
import { getUserSession } from "@/lib/session";
import { CYCLE_LENGTH, REWARD_TITLE } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MARQUEE = [
  "Baked at 5 AM daily",
  "Small-batch, always fresh",
  "Eggless options",
  "Dynamic QR checkout",
  "+1 point on every order",
  "Free treat every 5th order",
  "WhatsApp order updates",
];

export default async function HomePage() {
  const session = await getUserSession();

  return (
    <main className="min-h-screen overflow-x-clip">
      <SiteHeader authed={Boolean(session)} name={session?.name} />
      <CartDrawer />

      {/* ---------------------------------------------------------- hero */}
      <section className="relative px-4 pb-16 pt-28 sm:px-6 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-10 size-[30rem] rounded-full bg-blush/40 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-caramel/30 bg-caramel/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ember">
                <Sparkles className="size-3.5" /> Home bakery · Since 2021
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.04] tracking-tight text-cocoa sm:text-6xl lg:text-[4.4rem]">
                Baked at dawn.
                <br />
                <em className="font-medium italic text-caramel">Gone by dusk.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-bark/80">
                Croissants, sourdough, truffle cakes and more — made in a home
                kitchen with obsessive care. Order online, pay by QR, and earn
                a point on every single purchase.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#menu"
                  className="group inline-flex items-center gap-2 rounded-full bg-cocoa px-6 py-3.5 text-sm font-bold text-ivory transition hover:bg-bark"
                >
                  <ShoppingBag className="size-4" />
                  Order fresh today
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  href={session ? "/dashboard" : "/auth"}
                  className="inline-flex items-center gap-2 rounded-full border border-cocoa/20 bg-ivory px-6 py-3.5 text-sm font-bold text-cocoa transition hover:border-caramel hover:text-caramel"
                >
                  <Gift className="size-4" />
                  {session ? "My loyalty circle" : "Join the loyalty circle"}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <p className="flex items-center gap-1 font-display text-2xl font-bold text-cocoa">
                    4.9 <Star className="size-4 fill-gold text-gold" />
                  </p>
                  <p className="text-xs text-bark/60">620+ neighbourhood reviews</p>
                </div>
                <div className="h-10 w-px bg-cocoa/10" />
                <div>
                  <p className="font-display text-2xl font-bold text-cocoa">5th</p>
                  <p className="text-xs text-bark/60">order unlocks a free treat</p>
                </div>
                <div className="h-10 w-px bg-cocoa/10" />
                <div>
                  <p className="font-display text-2xl font-bold text-cocoa">45 min</p>
                  <p className="text-xs text-bark/60">average doorstep delivery</p>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={40}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- marquee */}
      <section className="border-y border-cocoa/10 bg-cocoa py-3.5">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-sm font-semibold tracking-wide text-sand"
            >
              {item}
              <Wheat className="size-4 text-gold" />
            </span>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- menu */}
      <section id="menu" className="scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">
                  Today&apos;s counter
                </p>
                <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-cocoa sm:text-5xl">
                  The bake list
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-bark/70">
                <Clock3 className="size-4 text-caramel" />
                Baked 5 AM — available till sold out
              </p>
            </div>
          </Reveal>
          <div className="mt-10">
            <MenuSection />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- loyalty */}
      <section id="loyalty" className="scroll-mt-24 bg-cocoa px-4 py-20 text-cream sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              The loyalty circle
            </p>
            <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Every 5th order, <em className="italic text-gold">a gift comes out of the oven.</em>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/70">
              One point per purchase — online or walk-in, it all counts. Complete a
              cycle of five and unlock the <strong className="text-cream">{REWARD_TITLE}</strong>;
              your counter then resets and a fresh cycle begins. Forever.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-12 rounded-3xl border border-cream/15 bg-bark/40 p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {Array.from({ length: CYCLE_LENGTH }).map((_, i) => (
                  <div key={i} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`grid size-12 place-items-center rounded-full border font-display text-lg font-bold sm:size-14 ${
                          i === CYCLE_LENGTH - 1
                            ? "border-gold bg-gold text-cocoa"
                            : "border-cream/25 bg-cocoa text-cream"
                        }`}
                      >
                        {i === CYCLE_LENGTH - 1 ? <Gift className="size-5" /> : i + 1}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-cream/60">
                        {i === CYCLE_LENGTH - 1 ? "Reward!" : `Order ${i + 1}`}
                      </p>
                    </div>
                    {i < CYCLE_LENGTH - 1 && (
                      <div className="mx-2 h-px flex-1 border-t border-dashed border-cream/25" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-center gap-3 text-sm text-cream/80">
                <RotateCcw className="size-4 text-gold" />
                <p>
                  After the 5th order, your counter resets — the next purchase starts a
                  brand-new cycle at 1/{CYCLE_LENGTH}.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShoppingBag,
                title: "1 purchase = 1 point",
                text: "Online checkout or walk-in POS — every bill adds exactly one loyalty point.",
              },
              {
                icon: QrCode,
                title: "Pay by QR anywhere",
                text: "Dynamic bill-value QR online, in-store scanner at the counter. Verified payments only.",
              },
              {
                icon: Gift,
                title: "5th order reward",
                text: `${REWARD_TITLE} on your 5th purchase — you and the owner both get WhatsApp alerts.`,
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={0.08 * i}>
                <div className="h-full rounded-3xl border border-cream/15 bg-cream/5 p-6">
                  <f.icon className="size-6 text-gold" />
                  <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/70">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- story */}
      <section id="story" className="scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2.5rem] border border-cocoa/10 shadow-soft">
              <Image
                src="/images/baker-portrait.jpg"
                alt="Meera, the home baker behind Yummy Bakes"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">
                Our story
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-cocoa sm:text-5xl">
                One home kitchen.
                <br />
                <em className="italic text-caramel">Zero shortcuts.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-base leading-relaxed text-bark/80">
                Yummy Bakes started as Meera&apos;s weekend ritual — croissants for
                the building, sourdough for the lane, a truffle cake for every
                birthday on the street. Five years on, it&apos;s still one oven, one
                pair of hands, and a rule that nothing leaves the kitchen unless
                it would be served at her own table.
              </p>
              <p className="mt-4 text-base leading-relaxed text-bark/80">
                Every order you place — here online or at the counter — feeds your
                loyalty circle, and every fifth one comes back as a gift.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-xs font-bold text-bark">
                  <Baby className="size-4 text-caramel" /> Eggless on request
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-xs font-bold text-bark">
                  <Clock3 className="size-4 text-caramel" /> Tue – Sun · 8 AM – 8 PM
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-xs font-bold text-bark">
                  <MapPin className="size-4 text-caramel" /> 12, Rose Garden Lane
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- footer */}
      <footer className="border-t border-cocoa/10 bg-ivory px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-display text-2xl font-semibold text-cocoa">Yummy Bakes</p>
            <p className="mt-1 text-sm text-bark/60">
              12, Rose Garden Lane · Baked fresh Tue – Sun, 8 AM – 8 PM
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-bark/70">
            <a href="tel:+919876500000" className="flex items-center gap-2 transition hover:text-caramel">
              <Phone className="size-4 text-caramel" /> +91 98765 00000
            </a>
            <span className="flex items-center gap-2">
              <QrCode className="size-4 text-caramel" /> UPI accepted · yummybakes@okhdfcbank
            </span>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-bark/40">
          © {new Date().getFullYear()} Yummy Bakes Home Bakery. A neighbourhood kitchen with a loyalty circle that never stops looping.
        </p>
      </footer>
    </main>
  );
}
