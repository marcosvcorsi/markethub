export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3004";

export const Routes = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  PAYMENT_SUCCESS: "/payment/success",
  PAYMENT_CANCEL: "/payment/cancel",
  SIGN_IN: "/auth/signin",
} as const;
