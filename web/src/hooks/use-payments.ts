"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { clientFetch } from "@/lib/api-client";
import type { Order } from "@/types/order";
import type { CheckoutResponse } from "@/types/payment";

interface CreateOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export function useCreateOrder() {
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (items: CreateOrderItem[]) =>
      clientFetch<Order>("/orders/orders", session?.accessToken, {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
  });
}

export function useCreateCheckout() {
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (params: {
      orderId: string;
      successUrl: string;
      cancelUrl: string;
    }) =>
      clientFetch<CheckoutResponse>(
        "/payments/payments/checkout",
        session?.accessToken,
        {
          method: "POST",
          body: JSON.stringify(params),
        },
      ),
  });
}
