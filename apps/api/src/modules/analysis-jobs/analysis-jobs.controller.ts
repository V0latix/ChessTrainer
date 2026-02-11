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
import { AnalysisJobsService } from './analysis-jobs.service';

@Controller('analysis')
export class AnalysisJobsController {
  constructor(private readonly analysisJobsService: AnalysisJobsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('jobs')
  async enqueueAnalysisJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { game_ids?: unknown } = {},
  ) {
    if (
      body.game_ids !== undefined &&
      (!Array.isArray(body.game_ids) ||
        body.game_ids.some((value) => typeof value !== 'string'))
    ) {
      throw new BadRequestException('game_ids must be an array of strings.');
    }

    const result = await this.analysisJobsService.enqueueFromImportedGames({
      user_id: user.local_user_id,
      game_ids: body.game_ids as string[] | undefined,
    });

    return {
      data: {
        enqueued_count: result.enqueued_count,
        skipped_count: result.skipped_count,
        jobs: result.jobs,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('jobs/:job_id')
  async getAnalysisJobStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('job_id') jobId: string,
  ) {
    const normalizedJobId = jobId.trim();

    if (!normalizedJobId) {
      throw new BadRequestException('job_id is required.');
    }

    const result = await this.analysisJobsService.getJobStatus({
      user_id: user.local_user_id,
      job_id: normalizedJobId,
    });

    return {
      data: result,
    };
  }
}
