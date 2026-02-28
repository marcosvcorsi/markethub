"use client";

import { useCartStore } from "@/stores/cart-store";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Routes } from "@/lib/constants";
import { useEffect, useState } from "react";

export function CartBadge() {
  const [count, setCount] = useState(0);
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    setCount(items.reduce((sum, item) => sum + item.quantity, 0));
  }, [items]);

  return (
    <Link href={Routes.CART} className="relative">
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
