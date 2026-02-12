import { env } from '../config/env';

export type CoachReviewMistake = {
  mistake_id: string;
  game_id: string;
  game_url: string;
  chess_com_username: string;
  fen: string;
  phase: string;
  severity: string;
  category: string;
  played_move_uci: string;
  best_move_uci: string;
  eval_drop_cp: number;
  ply_index: number;
  created_at: string;
  wrong_move_explanation: string;
  best_move_explanation: string;
};

export type CoachReviewMistakesResponse = {
  student_user_id: string;
  mistakes: CoachReviewMistake[];
};

export type CoachReviewImportResponse = {
  student_user_id: string;
  username: string;
  scanned_count: number;
  imported_count: number;
  already_existing_count: number;
  failed_count: number;
  failures: Array<{
    game_url: string;
    reason: string;
  }>;
  unavailable_periods: Array<{
    period: string;
    archive_url: string;
    reason: string;
  }>;
};

export async function getCoachReviewMistakes(params: {
  accessToken: string;
  studentUserId: string;
  limit?: number;
}): Promise<CoachReviewMistakesResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const query = new URLSearchParams({
    student_user_id: params.studentUserId,
  });
  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  const response = await fetch(
    `${env.apiBaseUrl}/coach/review/mistakes?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Coach review mistakes fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: CoachReviewMistakesResponse };
  return payload.data;
}

export async function importCoachStudentGames(params: {
  accessToken: string;
  studentUserId: string;
  chessComUsername: string;
}): Promise<CoachReviewImportResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/coach/review/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      student_user_id: params.studentUserId,
      chess_com_username: params.chessComUsername,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Coach review import failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: CoachReviewImportResponse };
  return payload.data;
}
