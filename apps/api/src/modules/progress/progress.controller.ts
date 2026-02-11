import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('summary')
  async getSummary(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.progressService.getSummary({
      user_id: user.local_user_id,
    });

    return {
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('trends')
  async getTrends(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedDays = Number(days);
    const parsedLimit = Number(limit);
    const resolvedDays = Number.isFinite(parsedDays)
      ? Math.min(60, Math.max(1, parsedDays))
      : 14;
    const resolvedLimit = Number.isFinite(parsedLimit)
      ? Math.min(20, Math.max(1, parsedLimit))
      : 8;

    const result = await this.progressService.getTrends({
      user_id: user.local_user_id,
      window_days: resolvedDays,
      limit: resolvedLimit,
    });

    return {
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('sessions')
  async recordPuzzleSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      total_puzzles?: number;
      solved_puzzles?: number;
      skipped_puzzles?: number;
    },
  ) {
    const totalPuzzles = this.requireNonNegativeInt(
      body.total_puzzles,
      'total_puzzles',
    );
    const solvedPuzzles = this.requireNonNegativeInt(
      body.solved_puzzles,
      'solved_puzzles',
    );
    const skippedPuzzles = this.requireNonNegativeInt(
      body.skipped_puzzles,
      'skipped_puzzles',
    );

    if (totalPuzzles < 1) {
      throw new BadRequestException('total_puzzles must be >= 1.');
    }

    if (solvedPuzzles + skippedPuzzles > totalPuzzles) {
      throw new BadRequestException(
        'solved_puzzles + skipped_puzzles must be <= total_puzzles.',
      );
    }

    const result = await this.progressService.recordPuzzleSession({
      user_id: user.local_user_id,
      total_puzzles: totalPuzzles,
      solved_puzzles: solvedPuzzles,
      skipped_puzzles: skippedPuzzles,
    });

    return {
      data: result,
    };
  }

  private requireNonNegativeInt(value: unknown, fieldName: string) {
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative integer.`,
      );
    }

    return value as number;
  }
}
