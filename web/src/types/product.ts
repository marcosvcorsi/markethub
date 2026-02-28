export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductSortBy = "PRICE_ASC" | "PRICE_DESC" | "NEWEST" | "NAME";

export interface ProductQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
