import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Routes } from "@/lib/constants";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <XCircle className="text-muted-foreground h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment was cancelled. Your cart items are still saved.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={Routes.CART}>Return to Cart</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={Routes.PRODUCTS}>Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
