import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

interface SearchSuggestionsProps {
  query: string;
  products: Product[];
  activeIndex: number;
  onSelectProduct: (product: Product) => void;
  onSearchAll: () => void;
}

export function SearchSuggestions({
  query,
  products,
  activeIndex,
  onSelectProduct,
  onSearchAll,
}: SearchSuggestionsProps) {
  if (products.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-white/10">
        <Search className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs text-muted-foreground">
          Results for{" "}
          <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
        </span>
      </div>

      {/* Suggestions list */}
      <ul role="listbox">
        {products.map((product, index) => (
          <li key={product.id} role="option" aria-selected={index === activeIndex}>
            <Link
              href={Routes.PRODUCT_DETAIL(product.id)}
              onClick={() => onSelectProduct(product)}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950 ${
                index === activeIndex
                  ? "bg-indigo-50 dark:bg-indigo-950"
                  : ""
              }`}
            >
              <span className="truncate font-medium">{product.name}</span>
              <span className="ml-4 shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(product.price)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <button
        onClick={onSearchAll}
        className="flex w-full cursor-pointer items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-white/10 dark:text-indigo-400 dark:hover:bg-indigo-950"
      >
        <span>Search all results for &ldquo;{query}&rdquo;</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
