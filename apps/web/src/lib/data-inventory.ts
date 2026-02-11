import { env } from '../config/env';

export type DataInventoryResponse = {
  generated_at: string;
  counts: {
    games_count: number;
    analyses_count: number;
    move_evaluations_count: number;
    critical_mistakes_count: number;
    puzzle_sessions_count: number;
  };
  latest_updates: {
    last_game_import: {
      game_id: string;
      game_url: string;
      chess_com_username: string;
      period: string;
      imported_at: string;
    } | null;
    last_analysis_update: {
      job_id: string;
      game_id: string;
      status: string;
      updated_at: string;
      completed_at: string | null;
    } | null;
    last_mistake_update: {
      mistake_id: string;
      game_id: string;
      category: string;
      updated_at: string;
    } | null;
  };
};

export async function getDataInventory(params: {
  accessToken: string;
}): Promise<DataInventoryResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/data/inventory`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Data inventory fetch failed (${response.status}): ${responseText}`);
  }

  const payload = (await response.json()) as { data: DataInventoryResponse };
  return payload.data;
}
