"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCartStore } from "@/stores/cart-store";
import { Routes } from "@/lib/constants";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your order has been placed successfully. You can track it in your
            orders page.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={Routes.ORDERS}>View My Orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={Routes.PRODUCTS}>Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
