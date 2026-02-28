"use client";

import { SearchBar } from "@/components/layout/search-bar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Routes } from "@/lib/constants";
import { Menu, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <Link
              href={Routes.HOME}
              className="flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <ShoppingBag className="text-primary h-6 w-6" />
              <span className="text-xl font-bold">MarketHub</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <Suspense>
            <SearchBar />
          </Suspense>
          <nav className="flex flex-col gap-2">
            <Link
              href={Routes.PRODUCTS}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors"
              onClick={() => setOpen(false)}
            >
              Products
            </Link>
            <Link
              href={Routes.ORDERS}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors"
              onClick={() => setOpen(false)}
            >
              My Orders
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
