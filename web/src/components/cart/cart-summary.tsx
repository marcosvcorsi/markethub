"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span>{totalItems}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Subtotal</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" size="lg" disabled={items.length === 0}>
          <Link href={Routes.CHECKOUT}>Proceed to Checkout</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
