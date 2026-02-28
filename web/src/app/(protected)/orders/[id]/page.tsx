"use client";

import { OrderItemsTable } from "@/components/orders/order-items-table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelOrder, useOrder } from "@/hooks/use-orders";
import { formatDate } from "@/lib/utils";
import { CANCELLABLE_STATUSES } from "@/types/order";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const cancelOrder = useCancelOrder();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-medium">Order not found</p>
        <Button asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(order!.id);
      toast.success("Order cancelled successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel order",
      );
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItemsTable
              items={order.items}
              totalAmount={Number(order.totalAmount)}
            />
          </CardContent>
        </Card>
      </div>

      {canCancel && (
        <>
          <Separator className="my-6" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this order? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelOrder.isPending}
                >
                  {cancelOrder.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cancel Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
