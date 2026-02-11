import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { AnalysisJobsController } from './analysis-jobs.controller';
import { AnalysisJobsService } from './analysis-jobs.service';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule],
  controllers: [AnalysisJobsController],
  providers: [AnalysisJobsService],
})
export class AnalysisJobsModule {}
