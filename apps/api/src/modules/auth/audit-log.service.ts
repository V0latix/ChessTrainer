import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction =
  | 'login'
  | 'account_deletion_requested'
  | 'account_deletion_completed'
  | 'data_export_requested'
  | 'data_deletion_requested';

export type AuditLogInput = {
  actor_user_id: string | null;
  actor_supabase_sub: string | null;
  action: AuditAction;
  trace_id: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logSensitiveAction(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actor_user_id,
        actorSupabaseSub: input.actor_supabase_sub,
        action: input.action,
        traceId: input.trace_id,
        metadata: input.metadata,
      },
    });
  }

  async listActorAuditLogs(actorUserId: string, limit = 50) {
    const normalizedLimit = Math.max(1, Math.min(100, limit));

    const logs = await this.prisma.auditLog.findMany({
      where: {
        actorUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: normalizedLimit,
    });

    return logs.map((log) => ({
      id: log.id,
      actor_user_id: log.actorUserId,
      actor_supabase_sub: log.actorSupabaseSub,
      action: log.action,
      trace_id: log.traceId,
      metadata: log.metadata,
      created_at: log.createdAt.toISOString(),
    }));
  }
}
