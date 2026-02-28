import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/constants";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link href={Routes.HOME}>Go Home</Link>
      </Button>
    </div>
  );
}
