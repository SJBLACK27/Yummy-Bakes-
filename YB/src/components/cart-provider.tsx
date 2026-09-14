"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS, type Product } from "@/lib/products";

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  qtyOf: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "yb_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMap(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }, [map, hydrated]);

  const add = useCallback((id: string) => {
    setMap((m) => ({ ...m, [id]: Math.min(10, (m[id] ?? 0) + 1) }));
  }, []);

  const decrement = useCallback((id: string) => {
    setMap((m) => {
      const next = { ...m };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setMap((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setMap({}), []);

  const qtyOf = useCallback((id: string) => map[id] ?? 0, [map]);

  const { lines, count, total } = useMemo(() => {
    const lines: CartLine[] = Object.entries(map)
      .map(([id, qty]) => {
        const product = PRODUCTS.find((p) => p.id === id);
        return product ? { product, qty } : null;
      })
      .filter((l): l is CartLine => Boolean(l));
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
    };
  }, [map]);

  const value = useMemo(
    () => ({
      lines,
      count,
      total,
      open,
      setOpen,
      add,
      decrement,
      remove,
      clear,
      qtyOf,
    }),
    [lines, count, total, open, add, decrement, remove, clear, qtyOf],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
