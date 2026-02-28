import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { OrderItem } from "@/types/order";

interface OrderItemsTableProps {
  items: OrderItem[];
  totalAmount: number;
}

export function OrderItemsTable({ items, totalAmount }: OrderItemsTableProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground">
        <span className="col-span-2">Product</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Subtotal</span>
      </div>
      <Separator />
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-4 text-sm">
          <span className="col-span-2">{item.productName}</span>
          <span className="text-right">{item.quantity}</span>
          <span className="text-right">
            {formatCurrency(Number(item.unitPrice) * item.quantity)}
          </span>
        </div>
      ))}
      <Separator />
      <div className="grid grid-cols-4 font-medium">
        <span className="col-span-3">Total</span>
        <span className="text-right">{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
