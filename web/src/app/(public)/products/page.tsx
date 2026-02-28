import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { serverFetch } from "@/lib/api-client";
import type { PaginatedResponse, Product } from "@/types/product";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | MarketHub",
  description: "Browse our marketplace products",
};

export default async function ProductsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  if (searchParams.q) query.set("q", searchParams.q);
  if (searchParams.category) query.set("category", searchParams.category);
  if (searchParams.minPrice) query.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) query.set("maxPrice", searchParams.maxPrice);
  if (searchParams.sortBy) query.set("sortBy", searchParams.sortBy);
  if (searchParams.page) query.set("page", searchParams.page);
  query.set("limit", "20");

  let result: PaginatedResponse<Product>;
  try {
    result = await serverFetch<PaginatedResponse<Product>>(
      `/products/products?${query.toString()}`,
    );
  } catch {
    result = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {searchParams.q ? `Results for "${searchParams.q}"` : "All Products"}
      </h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <Suspense>
            <ProductFilters />
          </Suspense>
        </aside>
        <div className="flex-1">
          <ProductGrid products={result.data} />
          <Suspense>
            <PaginationControls meta={result.meta} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
