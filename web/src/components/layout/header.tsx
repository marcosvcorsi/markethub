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
