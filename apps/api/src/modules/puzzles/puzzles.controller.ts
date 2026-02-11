import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(SupabaseAuthGuard)
  @Post(':puzzle_id/attempt')
  async evaluatePuzzleAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('puzzle_id') puzzleId: string,
    @Body() body: { attempted_move_uci?: string },
  ) {
    const normalizedPuzzleId = puzzleId.trim();
    const attemptedMove = body.attempted_move_uci?.trim().toLowerCase() ?? '';

    if (!normalizedPuzzleId) {
      throw new BadRequestException('puzzle_id is required.');
    }

    if (
      !attemptedMove ||
      !/^[a-h][1-8][a-h][1-8][nbrq]?$/.test(attemptedMove)
    ) {
      throw new BadRequestException(
        'attempted_move_uci must be a valid UCI move string.',
      );
    }

    const result = await this.puzzlesService.evaluateAttempt({
      user_id: user.local_user_id,
      puzzle_id: normalizedPuzzleId,
      attempted_move_uci: attemptedMove,
    });

    return {
      data: result,
    };
  }
}
