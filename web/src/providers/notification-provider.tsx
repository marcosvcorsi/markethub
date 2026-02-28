"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL } from "@/lib/constants";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(`${WS_URL}/notifications`, {
      query: { userId: session.user.id },
      transports: ["websocket"],
    });

    socket.on("order:created", (data: { message: string }) => {
      toast.success("Order created", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on(
      "payment:completed",
      (data: { message: string; orderId?: string }) => {
        toast.success("Payment confirmed", { description: data.message });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        if (data.orderId) {
          queryClient.invalidateQueries({
            queryKey: ["orders", data.orderId],
          });
        }
      },
    );

    socket.on("payment:failed", (data: { message: string }) => {
      toast.error("Payment failed", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on(
      "order:shipped",
      (data: { message: string; orderId?: string }) => {
        toast.info("Order shipped!", { description: data.message });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        if (data.orderId) {
          queryClient.invalidateQueries({
            queryKey: ["orders", data.orderId],
          });
        }
      },
    );

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, queryClient]);

  return <>{children}</>;
}
