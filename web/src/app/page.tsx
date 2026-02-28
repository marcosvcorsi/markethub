import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/api-client";
import { Routes } from "@/lib/constants";
import type { PaginatedResponse, Product } from "@/types/product";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    const result = await serverFetch<PaginatedResponse<Product>>(
      "/products/products?sortBy=NEWEST&limit=8",
    );
    featured = result.data;
  } catch {
    // Backend may not be running during development
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="text-primary mx-auto mb-6 h-16 w-16" />
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to MarketHub
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
            Discover amazing products from sellers around the world. Browse,
            buy, and enjoy a seamless shopping experience.
          </p>
          <Button asChild size="lg">
            <Link href={Routes.PRODUCTS}>
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Products</h2>
            <Button asChild variant="ghost">
              <Link href={Routes.PRODUCTS}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}
    </div>
  );
}
