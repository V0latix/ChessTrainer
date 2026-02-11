import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: {
        user_id: user.local_user_id,
        supabase_sub: user.supabase_sub,
        email: user.email,
        role: user.role,
      },
    };
  }
}
