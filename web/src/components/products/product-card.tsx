"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stock <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      image: product.images[0],
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Link href={Routes.PRODUCT_DETAIL(product.id)}>
      <Card
        className={`group h-full rounded-2xl border-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:ring-1 hover:ring-indigo-200 dark:border-white/10 dark:hover:ring-indigo-800 ${
          outOfStock ? "opacity-60 grayscale-[30%]" : ""
        }`}
      >
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-50 dark:bg-slate-800">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <span className="mb-2 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            {product.category}
          </span>
          <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(product.price)}
          </span>
          {outOfStock ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              Out of stock
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 opacity-0 transition-all duration-200 hover:bg-indigo-100 group-hover:opacity-100 sm:flex dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
