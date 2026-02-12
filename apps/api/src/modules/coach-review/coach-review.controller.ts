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
import { CoachReviewService } from './coach-review.service';

@Controller('coach/review')
export class CoachReviewController {
  constructor(private readonly coachReviewService: CoachReviewService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('import')
  async importStudentGames(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: { student_user_id?: string; chess_com_username?: string } = {},
  ) {
    const studentUserId = body.student_user_id?.trim();
    const chessComUsername = body.chess_com_username?.trim();

    if (!studentUserId) {
      throw new BadRequestException('student_user_id is required.');
    }

    if (!chessComUsername) {
      throw new BadRequestException('chess_com_username is required.');
    }

    const result = await this.coachReviewService.importStudentGames({
      coach_user_id: user.local_user_id,
      actor_role: user.role,
      student_user_id: studentUserId,
      chess_com_username: chessComUsername,
    });

    return {
      data: {
        student_user_id: studentUserId,
        ...result,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('mistakes')
  async listStudentMistakes(
    @CurrentUser() user: AuthenticatedUser,
    @Query('student_user_id') studentUserId?: string,
    @Query('limit') limit?: string,
  ) {
    const normalizedStudentUserId = studentUserId?.trim();
    const parsedLimit = Number(limit);
    const resolvedLimit = Number.isFinite(parsedLimit)
      ? Math.min(25, Math.max(1, parsedLimit))
      : 10;

    if (!normalizedStudentUserId) {
      throw new BadRequestException('student_user_id is required.');
    }

    const result = await this.coachReviewService.listStudentMistakes({
      coach_user_id: user.local_user_id,
      actor_role: user.role,
      student_user_id: normalizedStudentUserId,
      limit: resolvedLimit,
    });

    return {
      data: result,
    };
  }
}
