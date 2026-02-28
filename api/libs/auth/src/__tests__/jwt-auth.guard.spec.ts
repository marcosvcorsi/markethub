import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const createMockContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
        getNext: jest.fn(),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access when route is marked as @Public()', () => {
    const context = createMockContext();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should check IS_PUBLIC_KEY metadata on handler and class', () => {
    const context = createMockContext();
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);

    guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
