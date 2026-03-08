# MarketHub Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform MarketHub's neutral shadcn theme into a vibrant indigo/violet design with frosted-glass header, animated product cards, a gradient hero, and debounced search with autocomplete suggestions.

**Architecture:** Pure frontend changes — no backend or routing modifications. The search suggestions feature reuses the existing public `GET /products?q=...&limit=5` endpoint via a new React Query hook. All visual changes are Tailwind class updates and CSS variable overrides in `globals.css`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, shadcn/ui, React Query (TanStack), Lucide React

---

## Task 1: Update Color System in globals.css

**Files:**
- Modify: `web/src/app/globals.css`

Replace the neutral OKLCH palette with an indigo/violet/slate system. Open the file and make the following replacements inside the `:root { }` block and `.dark { }` block.

**Step 1: Replace the `:root` color tokens**

Find the `:root { ... }` block and replace the following variables (keep all others unchanged):

```css
:root {
  --radius: 0.625rem;
  --background: oklch(0.984 0.003 247);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.511 0.262 276);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.968 0.007 247);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.968 0.007 247);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.627 0.265 303);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.929 0.013 255);
  --input: oklch(0.929 0.013 255);
  --ring: oklch(0.511 0.262 276);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.984 0.003 247);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.511 0.262 276);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.627 0.265 303);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.929 0.013 255);
  --sidebar-ring: oklch(0.511 0.262 276);
}
```

**Step 2: Replace the `.dark` color tokens**

```css
.dark {
  --background: oklch(0.13 0.02 260);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.17 0.02 260);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.17 0.02 260);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.623 0.214 259);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.22 0.02 260);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.22 0.02 260);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.627 0.265 303);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.623 0.214 259);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.441);
  --sidebar: oklch(0.17 0.02 260);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.623 0.214 259);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.627 0.265 303);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.623 0.214 259);
}
```

**Step 3: Verify visually**

Run `cd web && npm run dev` and open `http://localhost:3001` (or whatever port). Buttons should now appear indigo instead of black.

**Step 4: Commit**

```bash
cd web
git add src/app/globals.css
git commit -m "feat: switch to indigo/violet color palette"
```

---

## Task 2: Redesign the Header

**Files:**
- Modify: `web/src/components/layout/header.tsx`

**Step 1: Replace the entire file content**

```tsx
"use client";

import { CartBadge } from "@/components/cart/cart-badge";
import { SearchBar } from "@/components/layout/search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Routes } from "@/lib/constants";
import { LogOut, Package, ShoppingBag, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <MobileNav />

        <Link href={Routes.HOME} className="flex items-center gap-2 shrink-0">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          <span className="hidden bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-bold text-transparent sm:inline">
            MarketHub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={Routes.PRODUCTS}
            className="group relative text-sm text-muted-foreground transition-colors hover:text-indigo-600"
          >
            Products
            <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 rounded-full bg-indigo-600 transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        <div className="hidden flex-1 justify-center sm:flex">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <CartBadge />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {session.user.preferred_username || session.user.name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={Routes.ORDERS}>
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href={Routes.SIGN_IN}>Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Verify**

- Header should have a frosted glass effect when scrolled over content
- Logo "MarketHub" should show an indigo→violet gradient
- "Products" nav link should have a sliding indigo underline on hover
- "Sign In" should be a filled indigo button

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: frosted glass header with indigo gradient logo"
```

---

## Task 3: Redesign the Hero Section

**Files:**
- Modify: `web/src/app/page.tsx`

**Step 1: Replace the entire file content**

```tsx
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
```

**Step 2: Verify**

- Hero should show a radial indigo/violet gradient background with a faint dot grid
- "MarketHub" in the heading should have an indigo→violet gradient
- Three trust pill badges should appear below the CTA button
- The arrow in the button animates right on hover

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: vibrant hero section with gradient and trust pills"
```

---

## Task 4: Redesign Product Cards

**Files:**
- Modify: `web/src/components/products/product-card.tsx`

**Step 1: Replace the entire file content**

```tsx
"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Routes } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stock <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      image: product.images[0],
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Link href={Routes.PRODUCT_DETAIL(product.id)}>
      <Card
        className={`group h-full rounded-2xl border-slate-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:ring-1 hover:ring-indigo-200 dark:border-white/10 dark:hover:ring-indigo-800 ${
          outOfStock ? "opacity-60 grayscale-[30%]" : ""
        }`}
      >
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-50 dark:bg-slate-800">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
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
          <span className="mb-2 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            {product.category}
          </span>
          <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(product.price)}
          </span>
          {outOfStock ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              Out of stock
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="hidden items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 opacity-0 transition-all duration-200 hover:bg-indigo-100 group-hover:opacity-100 sm:flex dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
```

**Step 2: Verify**

- Cards have rounded-2xl corners
- On hover: card lifts with indigo-tinted shadow, image zooms, indigo ring appears
- Category badge is indigo pill instead of gray
- Price is `text-indigo-600`
- On desktop hover: "Add" button appears at the bottom right; clicking it adds to cart without navigating

**Step 3: Commit**

```bash
git add src/components/products/product-card.tsx
git commit -m "feat: animated product cards with indigo accents and quick-add button"
```

---

## Task 5: Create useDebounce Hook

**Files:**
- Create: `web/src/hooks/use-debounce.ts`

**Step 1: Create the file**

```ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**Step 2: Verify**

No visual verification needed yet — it will be exercised in Task 6.

**Step 3: Commit**

```bash
git add src/hooks/use-debounce.ts
git commit -m "feat: add useDebounce utility hook"
```

---

## Task 6: Create useSearchSuggestions Hook

**Files:**
- Create: `web/src/hooks/use-search-suggestions.ts`

**Step 1: Create the file**

```ts
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
```

**Step 2: Verify**

The hook will be exercised through the SearchBar in Task 8. For now, ensure the file has no TypeScript errors:

```bash
cd web && npx tsc --noEmit
```

Expected: no errors related to the new file.

**Step 3: Commit**

```bash
git add src/hooks/use-search-suggestions.ts
git commit -m "feat: add useSearchSuggestions hook with React Query"
```

---

## Task 7: Create SearchSuggestions Dropdown Component

**Files:**
- Create: `web/src/components/layout/search-suggestions.tsx`

**Step 1: Create the file**

```tsx
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
        className="flex w-full items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-white/10 dark:text-indigo-400 dark:hover:bg-indigo-950"
      >
        <span>Search all results for &ldquo;{query}&rdquo;</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/layout/search-suggestions.tsx
git commit -m "feat: search suggestions dropdown component"
```

---

## Task 8: Update SearchBar with Debounce + Suggestions

**Files:**
- Modify: `web/src/components/layout/search-bar.tsx`

**Step 1: Replace the entire file content**

```tsx
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
```

**Step 2: Verify manually**

1. Navigate to `http://localhost:3001`
2. Click the search bar in the header
3. Type at least 2 characters (e.g., "lap")
4. Wait ~300ms — a dropdown should appear with up to 5 product name suggestions and prices
5. Use `↑` / `↓` arrows to navigate — highlighted row changes
6. Press `Escape` — dropdown closes
7. Click a suggestion — navigates to that product's detail page
8. Click "Search all results" footer — navigates to `/products?q=lap`
9. Press `Enter` with no suggestion selected — navigates to search results page

**Step 3: TypeScript check**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

**Step 4: Lint**

```bash
cd web && npm run lint
```

Expected: no new errors.

**Step 5: Commit**

```bash
git add src/components/layout/search-bar.tsx
git commit -m "feat: debounced search with autocomplete suggestions dropdown"
```

---

## Final Verification Checklist

After all tasks are complete, do a full pass:

- [ ] Color system: buttons, badges, links are indigo — not black
- [ ] Header: frosted glass on scroll, gradient logo, animated nav underline
- [ ] Hero: radial gradient bg, dot grid, gradient heading, trust pills, animated arrow CTA
- [ ] Product cards: hover lift + shadow + ring + image zoom, indigo price + badge, quick-add button reveals on hover
- [ ] Search: typing fires after 300ms, dropdown appears with product names + prices, keyboard nav works, Escape closes, Enter submits, clicking suggestion navigates to product

**Final commit (if any cleanup needed):**

```bash
git add -p
git commit -m "feat: complete frontend redesign — indigo theme + animated cards + search autocomplete"
```
