import { env } from '../config/env';

export type NextPuzzleResponse = {
  puzzle_id: string;
  source: 'critical_mistake';
  fen: string;
  side_to_move: 'white' | 'black';
  objective: string;
  context: {
    game_id: string;
    game_url: string;
    chess_com_username: string;
    opponent_username?: string | null;
    period: string;
    time_class: string | null;
    phase: string;
    severity: string;
    category: string;
    played_move_uci: string;
    best_move_uci: string;
    eval_drop_cp: number;
    ply_index: number;
    game_played_at?: string | null;
    created_at: string;
  };
};

export type PuzzleSessionResponse = {
  session_id: string;
  generated_at: string;
  total_puzzles: number;
  puzzles: NextPuzzleResponse[];
};

export type EvaluatePuzzleAttemptResponse = {
  puzzle_id: string;
  attempted_move_uci: string;
  best_move_uci: string;
  is_correct: boolean;
  status: 'correct' | 'incorrect';
  feedback_title: string;
  feedback_message: string;
  wrong_move_explanation: string;
  best_move_explanation: string;
  retry_available: boolean;
};

export async function getNextPuzzle(params: {
  accessToken: string;
}): Promise<NextPuzzleResponse | null> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/puzzles/next`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Puzzle fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: NextPuzzleResponse | null };
  return payload.data;
}

export async function evaluatePuzzleAttempt(params: {
  accessToken: string;
  puzzleId: string;
  attemptedMoveUci: string;
}): Promise<EvaluatePuzzleAttemptResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(
    `${env.apiBaseUrl}/puzzles/${encodeURIComponent(params.puzzleId)}/attempt`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        attempted_move_uci: params.attemptedMoveUci,
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Puzzle attempt failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: EvaluatePuzzleAttemptResponse };
  return payload.data;
}

export async function getPuzzleSession(params: {
  accessToken: string;
  limit?: number;
}): Promise<PuzzleSessionResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const query = new URLSearchParams();
  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  const response = await fetch(
    `${env.apiBaseUrl}/puzzles/session${query.size > 0 ? `?${query.toString()}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Puzzle session fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: PuzzleSessionResponse };
  return payload.data;
}
