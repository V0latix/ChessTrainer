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

export type ImportSelectedGamesResponse = {
  username: string;
  selected_count: number;
  imported_count: number;
  already_existing_count: number;
  failed_count: number;
  failures: Array<{
    game_url: string;
    reason: string;
  }>;
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

export async function importSelectedChessComGames(params: {
  accessToken: string;
  username: string;
  selectedGameUrls: string[];
}): Promise<ImportSelectedGamesResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/imports/chess-com/import-selected`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      username: params.username,
      selected_game_urls: params.selectedGameUrls,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Chess.com import failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: ImportSelectedGamesResponse };
  return payload.data;
}
