import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ImportsModule } from '../imports/imports.module';
import { CoachReviewController } from './coach-review.controller';
import { CoachReviewService } from './coach-review.service';

@Module({
  imports: [PrismaModule, AuthModule, ImportsModule],
  controllers: [CoachReviewController],
  providers: [CoachReviewService],
})
export class CoachReviewModule {}
