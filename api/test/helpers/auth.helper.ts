import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@markethub/common';

export const TEST_USER: UserContext = {
  sub: 'test-user-id-000',
  email: 'testuser@markethub.local',
  preferred_username: 'testuser',
  realm_access: { roles: ['user'] },
};

export const TEST_ADMIN: UserContext = {
  sub: 'test-admin-id-000',
  email: 'admin@markethub.local',
  preferred_username: 'admin',
  realm_access: { roles: ['user', 'admin'] },
};

export class MockAuthGuard implements CanActivate {
  constructor(private readonly user: UserContext = TEST_USER) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = this.user;
    return true;
  }
}
