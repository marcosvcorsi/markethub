"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Routes } from "@/lib/constants";
import type { ProductSortBy } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Automotive",
  "Health",
];

const SORT_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: "NEWEST", label: "Newest" },
  { value: "PRICE_ASC", label: "Price: Low to High" },
  { value: "PRICE_DESC", label: "Price: High to Low" },
  { value: "NAME", label: "Name" },
];

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${Routes.PRODUCTS}?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleClear() {
    router.push(Routes.PRODUCTS);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-medium">Category</h3>
        <Select
          value={searchParams.get("category") ?? ""}
          onValueChange={(v) => updateParam("category", v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">Price Range</h3>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            value={searchParams.get("minPrice") ?? ""}
            onChange={(e) => updateParam("minPrice", e.target.value || null)}
          />
          <Input
            type="number"
            placeholder="Max"
            min={0}
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(e) => updateParam("maxPrice", e.target.value || null)}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">Sort By</h3>
        <Select
          value={searchParams.get("sortBy") ?? ""}
          onValueChange={(v) => updateParam("sortBy", v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Button variant="outline" size="sm" onClick={handleClear}>
        Clear Filters
      </Button>
    </div>
  );
}
