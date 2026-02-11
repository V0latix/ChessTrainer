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
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('chess-com/candidate-games')
  async getChessComCandidateGames(
    @Query('username') username?: string,
    @Query('archives_count') archivesCount?: string,
  ) {
    const parsedArchivesCount = Number(archivesCount);
    const resolvedArchivesCount = Number.isFinite(parsedArchivesCount)
      ? parsedArchivesCount
      : 2;

    const result = await this.importsService.listCandidateGames(
      username ?? '',
      resolvedArchivesCount,
    );

    return {
      data: {
        username: result.username,
        candidate_games: result.candidate_games,
        unavailable_periods: result.unavailable_periods,
        total_candidate_games: result.candidate_games.length,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('chess-com/import-selected')
  async importSelectedChessComGames(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      username?: string;
      selected_game_urls?: string[];
      archives_count?: number;
    },
  ) {
    const username = body.username?.trim() ?? '';
    const selectedGameUrls = body.selected_game_urls ?? [];

    if (!username) {
      throw new BadRequestException('username is required.');
    }

    if (!Array.isArray(selectedGameUrls) || selectedGameUrls.length === 0) {
      throw new BadRequestException(
        'selected_game_urls must contain at least one game URL.',
      );
    }

    const summary = await this.importsService.importSelectedGames({
      user_id: user.local_user_id,
      username,
      selected_game_urls: selectedGameUrls,
      archives_count: body.archives_count,
    });

    return {
      data: {
        username: summary.username,
        selected_count: summary.selected_count,
        imported_count: summary.imported_count,
        already_existing_count: summary.already_existing_count,
        failed_count: summary.failed_count,
        failures: summary.failures,
      },
    };
  }
}
