"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/product";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      image: product.images[0],
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  }

  if (product.stock <= 0) {
    return (
      <Button disabled size="lg" className="w-full">
        Out of Stock
      </Button>
    );
  }

  return (
    <Button onClick={handleAdd} size="lg" className="w-full">
      <ShoppingCart className="mr-2 h-5 w-5" />
      Add to Cart
    </Button>
  );
}
