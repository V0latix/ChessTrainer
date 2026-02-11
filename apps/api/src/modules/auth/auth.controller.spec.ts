import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns snake_case identity payload and writes login audit log', async () => {
    const deleteAccount = jest.fn();
    const logSensitiveAction = jest.fn().mockResolvedValue(undefined);
    const listActorAuditLogs = jest.fn();

    const controller = new AuthController(
      { deleteAccount } as any,
      { logSensitiveAction, listActorAuditLogs } as any,
    );

    const response = await controller.getCurrentUser(
      {
        local_user_id: 'local-user-1',
        supabase_sub: 'supabase-sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      {
        traceId: 'trace-1',
      } as any,
    );

    expect(response).toEqual({
      data: {
        user_id: 'local-user-1',
        supabase_sub: 'supabase-sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
    });

    expect(logSensitiveAction).toHaveBeenCalledWith({
      actor_user_id: 'local-user-1',
      actor_supabase_sub: 'supabase-sub-1',
      action: 'login',
      trace_id: 'trace-1',
      metadata: {
        source: 'auth_me',
      },
    });
  });

  it('rejects deletion when confirmation is missing', async () => {
    const deleteAccount = jest.fn();
    const logSensitiveAction = jest.fn();

    const controller = new AuthController(
      { deleteAccount } as any,
      { logSensitiveAction, listActorAuditLogs: jest.fn() } as any,
    );

    await expect(
      controller.deleteAccount(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        { confirm_deletion: false },
        { traceId: 'trace-2' } as any,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(logSensitiveAction).not.toHaveBeenCalled();
  });

  it('deletes account, writes audit logs, and returns deleted flag when confirmed', async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    const logSensitiveAction = jest.fn().mockResolvedValue(undefined);

    const controller = new AuthController(
      { deleteAccount } as any,
      { logSensitiveAction, listActorAuditLogs: jest.fn() } as any,
    );

    await expect(
      controller.deleteAccount(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        { confirm_deletion: true },
        { traceId: 'trace-3' } as any,
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
    expect(logSensitiveAction).toHaveBeenNthCalledWith(1, {
      actor_user_id: 'local-user-1',
      actor_supabase_sub: 'supabase-sub-1',
      action: 'account_deletion_requested',
      trace_id: 'trace-3',
    });
    expect(logSensitiveAction).toHaveBeenNthCalledWith(2, {
      actor_user_id: 'local-user-1',
      actor_supabase_sub: 'supabase-sub-1',
      action: 'account_deletion_completed',
      trace_id: 'trace-3',
    });
  });

  it('returns queryable audit logs for authenticated user', async () => {
    const listActorAuditLogs = jest.fn().mockResolvedValue([
      {
        id: 'audit-1',
        actor_user_id: 'local-user-1',
        action: 'login',
        trace_id: 'trace-1',
        created_at: '2026-02-11T00:00:00.000Z',
      },
    ]);

    const controller = new AuthController(
      { deleteAccount: jest.fn() } as any,
      { logSensitiveAction: jest.fn(), listActorAuditLogs } as any,
    );

    await expect(
      controller.getAuditLogs(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        '20',
      ),
    ).resolves.toEqual({
      data: {
        logs: [
          {
            id: 'audit-1',
            actor_user_id: 'local-user-1',
            action: 'login',
            trace_id: 'trace-1',
            created_at: '2026-02-11T00:00:00.000Z',
          },
        ],
      },
    });

    expect(listActorAuditLogs).toHaveBeenCalledWith('local-user-1', 20);
  });
});
