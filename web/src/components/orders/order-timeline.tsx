import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const HAPPY_PATH = [
  OrderStatus.PENDING,
  OrderStatus.PAYMENT_PROCESSING,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const STEP_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: "Order Placed",
  [OrderStatus.PAYMENT_PROCESSING]: "Processing Payment",
  [OrderStatus.PAID]: "Payment Confirmed",
  [OrderStatus.SHIPPED]: "Shipped",
  [OrderStatus.DELIVERED]: "Delivered",
};

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const isFailed = status === OrderStatus.FAILED;
  const isCancelled = status === OrderStatus.CANCELLED;
  const isTerminal = isFailed || isCancelled;

  const currentIndex = HAPPY_PATH.indexOf(status);

  return (
    <div className="space-y-4">
      {HAPPY_PATH.map((step, index) => {
        const isCompleted =
          !isTerminal && currentIndex >= 0 && index < currentIndex;
        const isCurrent =
          !isTerminal && currentIndex >= 0 && index === currentIndex;
        const isFuture = !isCompleted && !isCurrent;

        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                isCompleted && "border-green-500 bg-green-500 text-white",
                isCurrent && "border-primary bg-primary text-primary-foreground",
                isFuture && "border-muted bg-muted text-muted-foreground",
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                isCurrent && "font-medium",
                isFuture && "text-muted-foreground",
              )}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}

      {isTerminal && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
            <X className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-red-600">
            {isFailed ? "Payment Failed" : "Order Cancelled"}
          </span>
        </div>
      )}
    </div>
  );
}
