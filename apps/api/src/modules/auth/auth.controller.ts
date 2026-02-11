import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type {
  AuthenticatedUser,
  RequestWithAuthUser,
} from '../../common/types/authenticated-user';
import { AccountDeletionService } from './account-deletion.service';
import { AuditLogService } from './audit-log.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly accountDeletionService: AccountDeletionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithAuthUser,
  ) {
    await this.auditLogService.logSensitiveAction({
      actor_user_id: user.local_user_id,
      actor_supabase_sub: user.supabase_sub,
      action: 'login',
      trace_id: request.traceId ?? 'missing-trace-id',
      metadata: {
        source: 'auth_me',
      },
    });

    return {
      data: {
        user_id: user.local_user_id,
        supabase_sub: user.supabase_sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { confirm_deletion?: boolean },
    @Req() request: RequestWithAuthUser,
  ) {
    if (!body?.confirm_deletion) {
      throw new BadRequestException(
        'Account deletion requires confirm_deletion=true.',
      );
    }

    await this.auditLogService.logSensitiveAction({
      actor_user_id: user.local_user_id,
      actor_supabase_sub: user.supabase_sub,
      action: 'account_deletion_requested',
      trace_id: request.traceId ?? 'missing-trace-id',
    });

    await this.accountDeletionService.deleteAccount(
      user.local_user_id,
      user.supabase_sub,
    );

    await this.auditLogService.logSensitiveAction({
      actor_user_id: user.local_user_id,
      actor_supabase_sub: user.supabase_sub,
      action: 'account_deletion_completed',
      trace_id: request.traceId ?? 'missing-trace-id',
    });

    return {
      data: {
        deleted: true,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('audit-logs')
  async getAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);
    const resolvedLimit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    const logs = await this.auditLogService.listActorAuditLogs(
      user.local_user_id,
      resolvedLimit,
    );

    return {
      data: {
        logs,
      },
    };
  }
}
