"use client";

import { SearchSuggestions } from "@/components/layout/search-suggestions";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { Routes } from "@/lib/constants";
import type { Product } from "@/types/product";
import { Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const { data, isFetching } = useSearchSuggestions(debouncedQuery);
  const suggestions = data?.data ?? [];

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open/close based on query length and results
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2 && suggestions.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
    setActiveIndex(-1);
  }, [debouncedQuery, suggestions.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigateSearch(query);
  }

  function navigateSearch(q: string) {
    setOpen(false);
    setActiveIndex(-1);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`${Routes.PRODUCTS}?${params.toString()}`);
  }

  function handleSelectProduct(product: Product) {
    setQuery(product.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      router.push(Routes.PRODUCT_DETAIL(selected.id));
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (debouncedQuery.trim().length >= 2 && suggestions.length > 0) {
              setOpen(true);
            }
          }}
          className="pl-9 pr-9 focus-visible:ring-indigo-500"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
        )}
      </form>

      {open && (
        <SearchSuggestions
          query={debouncedQuery}
          products={suggestions}
          activeIndex={activeIndex}
          onSelectProduct={handleSelectProduct}
          onSearchAll={() => navigateSearch(query)}
        />
      )}
    </div>
  );
}
