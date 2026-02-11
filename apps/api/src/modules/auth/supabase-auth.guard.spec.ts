import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  it('throws when bearer token is missing', async () => {
    const guard = new SupabaseAuthGuard(
      { verifyAccessToken: jest.fn() } as any,
      {
        upsertFromClaims: jest.fn(),
      } as any,
    );

    const request = { headers: {} };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('verifies token and stores local auth user on request', async () => {
    const verifyAccessToken = jest.fn().mockResolvedValue({
      sub: 'supabase-sub-1',
      email: 'leo@example.com',
    });

    const upsertFromClaims = jest.fn().mockResolvedValue({
      id: 'local-user-1',
      supabaseSub: 'supabase-sub-1',
      email: 'leo@example.com',
      role: 'user',
    });

    const guard = new SupabaseAuthGuard(
      { verifyAccessToken } as any,
      { upsertFromClaims } as any,
    );

    const request: any = {
      headers: {
        authorization: 'Bearer token-123',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifyAccessToken).toHaveBeenCalledWith('token-123');
    expect(upsertFromClaims).toHaveBeenCalledWith({
      sub: 'supabase-sub-1',
      email: 'leo@example.com',
    });
    expect(request.authUser).toEqual({
      local_user_id: 'local-user-1',
      supabase_sub: 'supabase-sub-1',
      email: 'leo@example.com',
      role: 'user',
    });
  });
});
