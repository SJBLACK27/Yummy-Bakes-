export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  tag?: string;
}

/** Bakery catalogue — single source of truth for pricing (server-validated). */
export const PRODUCTS: Product[] = [
  {
    id: "butter-croissant",
    name: "Butter Croissant",
    desc: "72-layer laminated, French butter, baked golden at dawn.",
    price: 90,
    image: "/images/butter-croissant.jpg",
    tag: "Bestseller",
  },
  {
    id: "blueberry-muffin",
    name: "Wild Blueberry Muffin",
    desc: "Burst berries, brown-sugar dome, warm vanilla crumb.",
    price: 120,
    image: "/images/blueberry-muffins.jpg",
  },
  {
    id: "sourdough-boule",
    name: "Country Sourdough",
    desc: "48-hour cold ferment, stone-baked crust, gentle tang.",
    price: 260,
    image: "/images/sourdough.jpg",
    tag: "Slow Ferment",
  },
  {
    id: "chocolate-truffle-cake",
    name: "Chocolate Truffle Cake",
    desc: "Dark ganache layers, 54% couverture, 500g of pure decadence.",
    price: 640,
    image: "/images/chocolate-truffle-cake.jpg",
    tag: "Signature",
  },
  {
    id: "red-velvet-cupcakes",
    name: "Red Velvet Cupcakes",
    desc: "Pair of velvety crimson crumb with cream-cheese swirl.",
    price: 180,
    image: "/images/red-velvet-cupcakes.jpg",
  },
  {
    id: "cinnamon-rolls",
    name: "Skillet Cinnamon Rolls",
    desc: "Two gooey swirls, Saigon cinnamon, vanilla glaze drizzle.",
    price: 160,
    image: "/images/cinnamon-rolls.jpg",
  },
  {
    id: "pistachio-macarons",
    name: "Pistachio Macarons",
    desc: "Box of four, Sicilian pistachio ganache, delicate shell.",
    price: 240,
    image: "/images/macarons.jpg",
  },
  {
    id: "berry-fruit-tart",
    name: "Glazed Berry Tart",
    desc: "Crisp sablé shell, vanilla custard, market berries.",
    price: 210,
    image: "/images/fruit-tart.jpg",
    tag: "Seasonal",
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function orderTotal(items: { productId: string; qty: number }[]): number {
  return items.reduce((sum, it) => {
    const p = findProduct(it.productId);
    return sum + (p ? p.price * Math.max(0, Math.min(10, it.qty)) : 0);
  }, 0);
}
