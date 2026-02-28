export interface JwtPayload {
  sub: string;
  email: string;
  preferred_username: string;
  email_verified: boolean;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<
    string,
    {
      roles: string[];
    }
  >;
}
