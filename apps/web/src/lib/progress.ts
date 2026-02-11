import { env } from '../config/env';

export type ProgressSummaryResponse = {
  generated_at: string;
  sessions_completed: number;
  puzzles_completed: number;
  puzzles_solved: number;
  puzzles_skipped: number;
  success_rate_percent: number | null;
  last_session_at: string | null;
  recent_mistakes: Array<{
    category: string;
    mistake_count: number;
    average_eval_drop_cp: number;
    updated_at: string;
  }>;
};

export type RecordPuzzleSessionResponse = {
  session_id: string;
  total_puzzles: number;
  solved_puzzles: number;
  skipped_puzzles: number;
  success_rate_percent: number;
  created_at: string;
};

export type ProgressTrendsResponse = {
  generated_at: string;
  window_days: number;
  compared_to_days: number;
  categories: Array<{
    category: string;
    recent_count: number;
    previous_count: number;
    delta_count: number;
    trend_direction: 'up' | 'down' | 'stable' | 'new';
    average_eval_drop_cp: number;
  }>;
};

export async function getProgressSummary(params: {
  accessToken: string;
}): Promise<ProgressSummaryResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/progress/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Progress summary fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: ProgressSummaryResponse };
  return payload.data;
}

export async function getProgressTrends(params: {
  accessToken: string;
  days?: number;
  limit?: number;
}): Promise<ProgressTrendsResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const query = new URLSearchParams();
  if (typeof params.days === 'number') {
    query.set('days', String(params.days));
  }
  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  const response = await fetch(
    `${env.apiBaseUrl}/progress/trends${query.size > 0 ? `?${query.toString()}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Progress trends fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: ProgressTrendsResponse };
  return payload.data;
}

export async function recordPuzzleSession(params: {
  accessToken: string;
  totalPuzzles: number;
  solvedPuzzles: number;
  skippedPuzzles: number;
}): Promise<RecordPuzzleSessionResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/progress/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      total_puzzles: params.totalPuzzles,
      solved_puzzles: params.solvedPuzzles,
      skipped_puzzles: params.skippedPuzzles,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Progress session record failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: RecordPuzzleSessionResponse };
  return payload.data;
}
