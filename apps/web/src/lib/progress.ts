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
