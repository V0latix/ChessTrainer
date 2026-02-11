import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export type EnqueueAnalysisPayload = {
  game_id: string;
  user_id: string;
};

@Injectable()
export class AnalysisQueueService {
  enqueueAnalysis(payload: EnqueueAnalysisPayload): Promise<{
    queue_job_id: string;
  }> {
    void payload;

    // Story 3.1: queue adapter skeleton.
    // BullMQ/Redis dispatch is wired in later stories.
    return Promise.resolve({
      queue_job_id: randomUUID(),
    });
  }
}
