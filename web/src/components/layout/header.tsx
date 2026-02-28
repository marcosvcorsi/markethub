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
    <header className="bg-background sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <MobileNav />

        <Link href={Routes.HOME} className="flex items-center gap-2">
          <ShoppingBag className="text-primary h-6 w-6" />
          <span className="text-xl font-bold hidden sm:inline">MarketHub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={Routes.PRODUCTS}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Products
          </Link>
        </nav>

        <div className="flex-1 hidden sm:flex justify-center">
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
            <Button asChild variant="outline" size="sm">
              <Link href={Routes.SIGN_IN}>Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
