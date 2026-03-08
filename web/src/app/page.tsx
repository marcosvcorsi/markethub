import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/api-client";
import { Routes } from "@/lib/constants";
import type { PaginatedResponse, Product } from "@/types/product";
import { ArrowRight, ShoppingBag, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    const result = await serverFetch<PaginatedResponse<Product>>(
      "/products?sortBy=newest&limit=8",
    );
    featured = result.data;
  } catch {
    // Backend may not be running during development
  }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-32"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.511 0.262 276 / 0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, oklch(0.627 0.265 303 / 0.07), transparent)",
        }}
      >
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.511 0.262 276 / 0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              MarketHub
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Discover amazing products from sellers around the world. Browse,
            buy, and enjoy a seamless shopping experience.
          </p>

          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="group shadow-lg shadow-indigo-500/25">
              <Link href={Routes.PRODUCTS}>
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: ShoppingBag, label: "10,000+ Products" },
              { icon: ShieldCheck, label: "Secure Checkout" },
              { icon: Zap, label: "Fast Delivery" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Products</h2>
            <Button asChild variant="ghost" className="group text-indigo-600 hover:text-indigo-700">
              <Link href={Routes.PRODUCTS}>
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}
    </div>
  );
}
