import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductImages } from "@/components/products/product-images";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { serverFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await serverFetch<Product>(`/products/products/${id}`);
    return {
      title: `${product.name} | MarketHub`,
      description: product.description.slice(0, 160),
    };
  } catch {
    return { title: "Product Not Found | MarketHub" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let product: Product;
  try {
    product = await serverFetch<Product>(`/products/products/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImages images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">
            {product.category}
          </Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(product.price)}
          </p>

          <Separator />

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Availability:</span>
            {product.stock > 0 ? (
              <span className="text-green-600">
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-destructive">Out of Stock</span>
            )}
          </div>

          <AddToCartButton product={product} />

          <Separator />

          <div>
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
