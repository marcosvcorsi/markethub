import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Routes } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-muted-foreground h-5 w-5" />
          <span className="text-muted-foreground text-sm">
            MarketHub &copy; {new Date().getFullYear()}
          </span>
        </div>
        <nav className="flex gap-6">
          <Link
            href={Routes.PRODUCTS}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Products
          </Link>
          <Link
            href={Routes.ORDERS}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Orders
          </Link>
        </nav>
      </div>
    </footer>
  );
}
