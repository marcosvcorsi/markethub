import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  [OrderStatus.PAYMENT_PROCESSING]: {
    label: "Processing Payment",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  [OrderStatus.PAID]: {
    label: "Paid",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  [OrderStatus.SHIPPED]: {
    label: "Shipped",
    className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  [OrderStatus.FAILED]: {
    label: "Failed",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
