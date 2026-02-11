import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns snake_case identity payload', () => {
    const controller = new AuthController({
      deleteAccount: jest.fn(),
    } as any);

    const response = controller.getCurrentUser({
      local_user_id: 'local-user-1',
      supabase_sub: 'supabase-sub-1',
      email: 'leo@example.com',
      role: 'user',
    });

    expect(response).toEqual({
      data: {
        user_id: 'local-user-1',
        supabase_sub: 'supabase-sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
    });
  });

  it('rejects deletion when confirmation is missing', async () => {
    const deleteAccount = jest.fn();
    const controller = new AuthController({ deleteAccount } as any);

    await expect(
      controller.deleteAccount(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        { confirm_deletion: false },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it('deletes account and returns deleted flag when confirmed', async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    const controller = new AuthController({ deleteAccount } as any);

    await expect(
      controller.deleteAccount(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        { confirm_deletion: true },
      ),
    ).resolves.toEqual({
      data: {
        deleted: true,
      },
    });

    expect(deleteAccount).toHaveBeenCalledWith(
      'local-user-1',
      'supabase-sub-1',
    );
  });
});
