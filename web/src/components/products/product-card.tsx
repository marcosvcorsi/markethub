import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={Routes.PRODUCT_DETAIL(product.id)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
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
          <Badge variant="secondary" className="mb-2">
            {product.category}
          </Badge>
          <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <span className="text-lg font-bold">
            {formatCurrency(product.price)}
          </span>
          {product.stock <= 0 && (
            <Badge variant="destructive">Out of stock</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
