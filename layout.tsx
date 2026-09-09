import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Yummy Bakes — Home Bakery & Loyalty Treats",
  description:
    "A small-batch home bakery. Order fresh bakes, earn loyalty points on every order, and unlock a free bake every 10th purchase.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${manrope.variable} bg-cream text-espresso antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#251610",
              color: "#FBF5EC",
              border: "1px solid rgba(251,245,236,0.14)",
              borderRadius: "14px",
              fontFamily: "var(--font-manrope)",
            },
          }}
        />
      </body>
    </html>
  );
}
