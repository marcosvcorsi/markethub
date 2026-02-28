import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET || "",
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.sub = profile?.sub ?? undefined;
        token.preferred_username = (
          profile as Record<string, unknown>
        )?.preferred_username as string;
        token.realm_access = (profile as Record<string, unknown>)
          ?.realm_access as { roles: string[] };
      }

      if (token.expiresAt && Date.now() / 1000 > (token.expiresAt as number)) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.preferred_username =
        (token.preferred_username as string) ?? "";
      session.user.roles = (token.realm_access as { roles: string[] })
        ?.roles ?? [];
      return session;
    },
  },
});
