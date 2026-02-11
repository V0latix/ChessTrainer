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
    period: string;
    time_class: string | null;
    phase: string;
    severity: string;
    category: string;
    played_move_uci: string;
    best_move_uci: string;
    eval_drop_cp: number;
    ply_index: number;
    created_at: string;
  };
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
