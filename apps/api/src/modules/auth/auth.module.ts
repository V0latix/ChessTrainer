import { Module } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';
import { AuditLogService } from './audit-log.service';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseJwtService } from './supabase-jwt.service';
import { UserIdentityService } from './user-identity.service';

@Module({
  controllers: [AuthController],
  providers: [
    SupabaseAuthGuard,
    SupabaseJwtService,
    UserIdentityService,
    AccountDeletionService,
    AuditLogService,
  ],
  exports: [SupabaseAuthGuard, SupabaseJwtService, UserIdentityService],
})
export class AuthModule {}
