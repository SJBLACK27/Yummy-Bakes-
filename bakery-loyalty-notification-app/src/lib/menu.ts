export type MenuItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  image: string;
  tag: string;
};

export const MENU: MenuItem[] = [
  {
    id: "croissant",
    name: "Classic Butter Croissant",
    price: 120,
    desc: "72-hour laminated dough, golden and impossibly flaky.",
    image: "/images/menu/croissant.jpg",
    tag: "Bestseller",
  },
  {
    id: "sourdough",
    name: "Rustic Sourdough Loaf",
    price: 280,
    desc: "Slow-fermented wild yeast loaf with a crackling crust.",
    image: "/images/menu/sourdough.jpg",
    tag: "48-hr ferment",
  },
  {
    id: "cupcakes",
    name: "Red Velvet Cupcakes",
    price: 320,
    desc: "Box of 4 with whipped cream-cheese frosting swirls.",
    image: "/images/menu/cupcakes.jpg",
    tag: "Party favourite",
  },
  {
    id: "cake",
    name: "Belgian Truffle Cake",
    price: 750,
    desc: "Dark chocolate sponge, silky ganache, hand-rolled curls.",
    image: "/images/menu/cake.jpg",
    tag: "Celebration",
  },
  {
    id: "cookies",
    name: "Sea Salt Choco Cookies",
    price: 240,
    desc: "Box of 6 gooey-centred cookies with molten chocolate.",
    image: "/images/menu/cookies.jpg",
    tag: "Kids love it",
  },
  {
    id: "cinnamon-rolls",
    name: "Cinnamon Rolls",
    price: 300,
    desc: "Box of 4 pillowy rolls drowned in cream-cheese glaze.",
    image: "/images/menu/cinnamon-rolls.jpg",
    tag: "Sunday special",
  },
  {
    id: "cheesecake",
    name: "Biscoff Cheesecake Jars",
    price: 360,
    desc: "Set of 2 layered jars with cookie-butter drizzle.",
    image: "/images/menu/cheesecake.jpg",
    tag: "No-bake",
  },
  {
    id: "brownies",
    name: "Walnut Fudge Brownies",
    price: 270,
    desc: "Box of 6 crackly-top brownies, dense and fudgy.",
    image: "/images/menu/brownies.jpg",
    tag: "Rich & fudgy",
  },
];

/** Loyalty rules — every purchase earns one loyalty point (a punch-card stamp). */
export const POINTS_PER_ORDER = 1; // one point per order, no matter the basket size
export const MILESTONE_EVERY = 10; // every 10th purchase
export const REWARD_TITLE = "FREE Signature Bake of Choice";
export const REWARD_DESCRIPTION =
  "Congratulations on your 10th order with Yummy Bakes! Pick any item from the menu completely on the house, freshly baked just for you.";

/** Points earned each time an order is placed — purely purchase-based. */
export function pointsForOrder(): number {
  return POINTS_PER_ORDER;
}
