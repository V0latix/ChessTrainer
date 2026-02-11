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
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CoachContextService } from './coach-context.service';

@Controller('coach')
export class CoachContextController {
  constructor(private readonly coachContextService: CoachContextService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('students')
  async listAuthorizedStudents(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.coachContextService.listAuthorizedStudents({
      coach_user_id: user.local_user_id,
      actor_role: user.role,
    });

    return {
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('context/select')
  async selectStudentContext(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { student_user_id?: string } = {},
  ) {
    const studentUserId = body.student_user_id?.trim();

    if (!studentUserId) {
      throw new BadRequestException('student_user_id is required.');
    }

    const result = await this.coachContextService.selectStudentContext({
      coach_user_id: user.local_user_id,
      actor_role: user.role,
      student_user_id: studentUserId,
    });

    return {
      data: result,
    };
  }
}
