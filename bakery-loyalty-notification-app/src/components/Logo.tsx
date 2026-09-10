import { CakeSlice } from "lucide-react";
import clsx from "clsx";

export function Logo({ dark = false, size = "md" }: { dark?: boolean; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={clsx(
          "grid place-items-center rounded-xl shadow-card",
          size === "lg" ? "h-11 w-11" : "h-9 w-9",
          "bg-gradient-to-br from-caramel to-caramel-deep text-cream"
        )}
      >
        <CakeSlice size={size === "lg" ? 22 : 18} strokeWidth={2.2} />
      </span>
      <span
        className={clsx(
          "font-display leading-none",
          size === "lg" ? "text-2xl" : "text-xl",
          dark ? "text-cream" : "text-espresso"
        )}
      >
        Yummy
        <span className={clsx("italic", dark ? "text-butter" : "text-caramel-deep")}>
          {" "}
          Bakes
        </span>
      </span>
    </span>
  );
}
