import { Module } from '@nestjs/common';
import { AnalysisQueueService } from './analysis-queue.service';

@Module({
  providers: [AnalysisQueueService],
  exports: [AnalysisQueueService],
})
export class QueueModule {}
