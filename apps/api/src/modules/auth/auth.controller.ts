import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AccountDeletionService } from './account-deletion.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly accountDeletionService: AccountDeletionService,
  ) {}

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

  @UseGuards(SupabaseAuthGuard)
  @Post('delete-account')
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { confirm_deletion?: boolean },
  ) {
    if (!body?.confirm_deletion) {
      throw new BadRequestException(
        'Account deletion requires confirm_deletion=true.',
      );
    }

    await this.accountDeletionService.deleteAccount(
      user.local_user_id,
      user.supabase_sub,
    );

    return {
      data: {
        deleted: true,
      },
    };
  }
}
