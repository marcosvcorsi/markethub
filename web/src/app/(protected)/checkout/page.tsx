"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { useCreateCheckout, useCreateOrder } from "@/hooks/use-payments";
import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const createOrder = useCreateOrder();
  const createCheckout = useCreateCheckout();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="text-muted-foreground h-16 w-16" />
        <h1 className="text-2xl font-bold">No items to checkout</h1>
        <Button asChild>
          <Link href={Routes.PRODUCTS}>Browse Products</Link>
        </Button>
      </div>
    );
  }

  const totalPrice = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  async function handleCheckout() {
    setProcessing(true);
    try {
      const order = await createOrder.mutateAsync(
        items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      );

      const { checkoutUrl } = await createCheckout.mutateAsync({
        orderId: order.id,
        successUrl:
          process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL ||
          `${window.location.origin}/payment/success`,
        cancelUrl:
          process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL ||
          `${window.location.origin}/payment/cancel`,
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed",
      );
      setProcessing(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.productName} x {item.quantity}
              </span>
              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCheckout}
            disabled={processing}
            size="lg"
            className="w-full"
          >
            {processing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            {processing ? "Processing..." : "Pay with Stripe"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
