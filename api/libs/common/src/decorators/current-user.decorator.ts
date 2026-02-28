import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  sub: string;
  email: string;
  preferred_username: string;
  realm_access?: {
    roles: string[];
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;

    return data ? user?.[data] : user;
  },
);
