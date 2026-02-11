import { UserIdentityService } from './user-identity.service';

describe('UserIdentityService', () => {
  it('upserts local user by supabase subject idempotently', async () => {
    const upsert = jest.fn().mockResolvedValue({
      id: 'local-user-1',
      supabaseSub: 'supabase-sub-1',
      email: 'leo@example.com',
      role: 'user',
    });

    const prisma = {
      user: { upsert },
    } as any;

    const service = new UserIdentityService(prisma);

    const claims = {
      sub: 'supabase-sub-1',
      email: 'LEO@EXAMPLE.COM',
    } as any;

    const first = await service.upsertFromClaims(claims);
    const second = await service.upsertFromClaims(claims);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(1, {
      where: { supabaseSub: 'supabase-sub-1' },
      create: {
        supabaseSub: 'supabase-sub-1',
        email: 'leo@example.com',
      },
      update: {
        email: 'leo@example.com',
      },
    });
    expect(first.id).toEqual(second.id);
  });
});
