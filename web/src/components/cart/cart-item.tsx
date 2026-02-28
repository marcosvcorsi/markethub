"use client";

import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem as CartItemType } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-center gap-4 border-b py-4">
      <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {item.image ? (
          <img
            src={item.image}
            alt={item.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground text-xs">No image</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-medium">{item.productName}</h3>
        <p className="text-muted-foreground text-sm">
          {formatCurrency(item.unitPrice)} each
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-24 text-right font-medium">
        {formatCurrency(item.unitPrice * item.quantity)}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={() => removeItem(item.productId)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
