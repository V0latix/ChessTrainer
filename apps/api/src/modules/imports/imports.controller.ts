import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
