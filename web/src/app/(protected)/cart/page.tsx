"use client";

import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { Routes } from "@/lib/constants";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="text-muted-foreground h-16 w-16" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Start shopping to add items to your cart
        </p>
        <Button asChild>
          <Link href={Routes.PRODUCTS}>Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>
        <aside className="w-full lg:w-80">
          <CartSummary />
        </aside>
      </div>
    </div>
  );
}
