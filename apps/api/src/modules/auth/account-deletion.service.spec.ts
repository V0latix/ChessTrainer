import { InternalServerErrorException } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';

describe('AccountDeletionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('deletes supabase auth user then local user transaction', async () => {
    const userDelete = jest.fn().mockResolvedValue(undefined);
    const transaction = jest.fn((callback) =>
      callback({ user: { delete: userDelete } }),
    );
    const prisma = {
      $transaction: transaction,
    } as any;

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    } as Response);

    const service = new AccountDeletionService(prisma);

    await service.deleteAccount('local-user-1', 'supabase-sub-1');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.supabase.co/auth/v1/admin/users/supabase-sub-1',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 'local-user-1' } });
  });

  it('fails when service role configuration is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const prisma = {
      $transaction: jest.fn(),
    } as any;

    const service = new AccountDeletionService(prisma);

    await expect(
      service.deleteAccount('local-user-1', 'supabase-sub-1'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
