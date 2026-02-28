"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";

interface PaginationControlsProps {
  meta: {
    page: number;
    totalPages: number;
  };
}

export function PaginationControls({ meta }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (meta.totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={meta.page <= 1}
        onClick={() => goToPage(meta.page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-muted-foreground text-sm">
        Page {meta.page} of {meta.totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={meta.page >= meta.totalPages}
        onClick={() => goToPage(meta.page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
