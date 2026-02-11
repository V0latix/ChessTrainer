import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  it('creates audit entries with normalized fields', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const prisma = {
      auditLog: {
        create,
      },
    } as any;

    const service = new AuditLogService(prisma);

    await service.logSensitiveAction({
      actor_user_id: 'local-user-1',
      actor_supabase_sub: 'supabase-sub-1',
      action: 'login',
      trace_id: 'trace-1',
      metadata: { source: 'auth_me' },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'local-user-1',
        actorSupabaseSub: 'supabase-sub-1',
        action: 'login',
        traceId: 'trace-1',
        metadata: { source: 'auth_me' },
      },
    });
  });

  it('lists queryable audit entries for one actor', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'audit-1',
        actorUserId: 'local-user-1',
        actorSupabaseSub: 'supabase-sub-1',
        action: 'account_deletion_requested',
        traceId: 'trace-1',
        metadata: { reason: 'user_request' },
        createdAt: new Date('2026-02-11T12:00:00.000Z'),
      },
    ]);

    const prisma = {
      auditLog: {
        findMany,
      },
    } as any;

    const service = new AuditLogService(prisma);

    const logs = await service.listActorAuditLogs('local-user-1', 150);

    expect(findMany).toHaveBeenCalledWith({
      where: { actorUserId: 'local-user-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    expect(logs).toEqual([
      {
        id: 'audit-1',
        actor_user_id: 'local-user-1',
        actor_supabase_sub: 'supabase-sub-1',
        action: 'account_deletion_requested',
        trace_id: 'trace-1',
        metadata: { reason: 'user_request' },
        created_at: '2026-02-11T12:00:00.000Z',
      },
    ]);
  });
});
