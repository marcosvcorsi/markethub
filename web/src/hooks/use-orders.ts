"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { clientFetch } from "@/lib/api-client";
import type { Order, OrderStatus } from "@/types/order";
import type { PaginatedResponse } from "@/types/product";

export function useOrders(params?: { status?: OrderStatus; page?: number }) {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.page) query.set("page", String(params.page));
      return clientFetch<PaginatedResponse<Order>>(
        `/orders/orders?${query.toString()}`,
        session?.accessToken,
      );
    },
    enabled: !!session?.accessToken,
  });
}

export function useOrder(id: string) {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () =>
      clientFetch<Order>(`/orders/orders/${id}`, session?.accessToken),
    enabled: !!session?.accessToken && !!id,
  });
}

export function useCancelOrder() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      clientFetch(`/orders/orders/${orderId}/cancel`, session?.accessToken, {
        method: "POST",
      }),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}
