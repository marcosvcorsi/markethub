import { clientFetch } from "@/lib/api-client";
import type { PaginatedResponse, Product } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () =>
      clientFetch<PaginatedResponse<Product>>(
        `/products?q=${encodeURIComponent(query)}&limit=5`,
      ),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
