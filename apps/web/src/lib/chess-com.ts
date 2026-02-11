import { env } from '../config/env';

export type CandidateGame = {
  game_url: string;
  period: string;
  end_time: string | null;
  time_class: string | null;
  rated: boolean;
  rules: string | null;
  white_username: string | null;
  black_username: string | null;
  white_result: string | null;
  black_result: string | null;
  selectable: boolean;
};

export type UnavailablePeriod = {
  period: string;
  archive_url: string;
  reason: string;
};

export type CandidateGamesResponse = {
  username: string;
  candidate_games: CandidateGame[];
  unavailable_periods: UnavailablePeriod[];
  total_candidate_games: number;
};

export async function listChessComCandidateGames(
  accessToken: string,
  username: string,
): Promise<CandidateGamesResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const url = new URL(`${env.apiBaseUrl}/imports/chess-com/candidate-games`);
  url.searchParams.set('username', username);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Chess.com fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: CandidateGamesResponse };
  return payload.data;
}
