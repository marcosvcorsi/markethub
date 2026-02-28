import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Routes } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types/order";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={Routes.ORDER_DETAIL(order.id)}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
            <p className="text-muted-foreground text-xs">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </p>
            <p className="font-medium">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>
          <ChevronRight className="text-muted-foreground h-5 w-5" />
        </CardContent>
      </Card>
    </Link>
  );
}
