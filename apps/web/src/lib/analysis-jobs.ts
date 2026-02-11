import { env } from '../config/env';

export type EnqueueAnalysisJobsResponse = {
  enqueued_count: number;
  skipped_count: number;
  jobs: Array<{
    job_id: string;
    game_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    queue_job_id: string;
    created_at: string;
  }>;
};

export type AnalysisJobStatusResponse = {
  job_id: string;
  game_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress_percent: number;
  eta_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
};

export async function enqueueAnalysisJobs(params: {
  accessToken: string;
  gameIds?: string[];
}): Promise<EnqueueAnalysisJobsResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const body: { game_ids?: string[] } = {};
  if (params.gameIds && params.gameIds.length > 0) {
    body.game_ids = params.gameIds;
  }

  const response = await fetch(`${env.apiBaseUrl}/analysis/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Analysis enqueue failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: EnqueueAnalysisJobsResponse };
  return payload.data;
}

export async function getAnalysisJobStatus(params: {
  accessToken: string;
  jobId: string;
}): Promise<AnalysisJobStatusResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(
    `${env.apiBaseUrl}/analysis/jobs/${encodeURIComponent(params.jobId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Analysis status fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: AnalysisJobStatusResponse };
  return payload.data;
}
