"use client";

import { OrderCard } from "@/components/orders/order-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/use-orders";
import { Routes } from "@/lib/constants";
import { OrderStatus } from "@/types/order";
import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUS_TABS: { label: string; value: OrderStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: OrderStatus.PENDING },
  { label: "Paid", value: OrderStatus.PAID },
  { label: "Shipped", value: OrderStatus.SHIPPED },
  { label: "Delivered", value: OrderStatus.DELIVERED },
  { label: "Cancelled", value: OrderStatus.CANCELLED },
  { label: "Failed", value: OrderStatus.FAILED },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ status: statusFilter, page });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.label}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <Package className="text-muted-foreground h-16 w-16" />
          <p className="text-lg font-medium">No orders found</p>
          <Button asChild>
            <Link href={Routes.PRODUCTS}>Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          {data.meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
