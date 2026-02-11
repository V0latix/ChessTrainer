import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PuzzlesService } from './puzzles.service';

@Controller('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('next')
  async getNextPuzzle(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.puzzlesService.getNextPuzzle({
      user_id: user.local_user_id,
    });

    return {
      data: result,
    };
  }
}
