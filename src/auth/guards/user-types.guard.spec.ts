import { UserTypesGuard } from './user-types.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('UserTypesGuard', () => {
  let guard: UserTypesGuard;

  beforeEach(() => {
    guard = new UserTypesGuard();
  });

  const createMockContext = (
    tipo: string | undefined,
    allowedTypes: string[] | null,
  ): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { tipo },
        }),
      }),
    }) as any;

  it('should allow access if no types are required', () => {
    const context = createMockContext('user', null);
    jest.spyOn(Reflect, 'getMetadata').mockReturnValue(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user type is not allowed', () => {
    const context = createMockContext('user', ['admin']);
    jest.spyOn(Reflect, 'getMetadata').mockReturnValue(['admin']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user type is in the allowed list', () => {
    const context = createMockContext('admin', ['admin']);
    jest.spyOn(Reflect, 'getMetadata').mockReturnValue(['admin']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
