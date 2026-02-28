import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams.callbackUrl || "/";

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <ShoppingBag className="text-primary h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Welcome to MarketHub</CardTitle>
          <CardDescription>
            Sign in to access your orders, cart, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("keycloak", { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in with Keycloak
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
