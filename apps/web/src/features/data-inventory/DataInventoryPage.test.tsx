import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataInventoryPage } from './DataInventoryPage';

const { getDataInventoryMock, deleteStoredDatasetsMock } = vi.hoisted(() => {
  return {
    getDataInventoryMock: vi.fn(),
    deleteStoredDatasetsMock: vi.fn(),
  };
});

vi.mock('../../lib/data-inventory', () => {
  return {
    getDataInventory: getDataInventoryMock,
    deleteStoredDatasets: deleteStoredDatasetsMock,
  };
});

vi.mock('../auth/auth-context', () => {
  return {
    useAuth: () => ({
      session: {
        access_token: 'access-token-1',
        user: {
          email: 'leo@example.com',
        },
      },
      isLoading: false,
      isConfigured: true,
    }),
  };
});

describe('DataInventoryPage', () => {
  beforeEach(() => {
    getDataInventoryMock.mockReset();
    deleteStoredDatasetsMock.mockReset();
  });

  it('renders stored counts and latest updates', async () => {
    getDataInventoryMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      counts: {
        games_count: 24,
        analyses_count: 12,
        move_evaluations_count: 580,
        critical_mistakes_count: 35,
        puzzle_sessions_count: 8,
      },
      latest_updates: {
        last_game_import: {
          game_id: 'game-1',
          game_url: 'https://www.chess.com/game/live/123',
          chess_com_username: 'leo',
          period: '2026-02',
          imported_at: '2026-02-11T10:00:00.000Z',
        },
        last_analysis_update: {
          job_id: 'job-1',
          game_id: 'game-1',
          status: 'completed',
          updated_at: '2026-02-11T10:05:00.000Z',
          completed_at: '2026-02-11T10:05:20.000Z',
        },
        last_mistake_update: {
          mistake_id: 'mistake-1',
          game_id: 'game-1',
          category: 'endgame_blunder',
          updated_at: '2026-02-11T10:06:00.000Z',
        },
      },
    });

    render(
      <MemoryRouter>
        <DataInventoryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getDataInventoryMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
      });
    });

    expect(screen.getByTestId('inventory-games-count')).toHaveTextContent('24');
    expect(screen.getByTestId('inventory-analyses-count')).toHaveTextContent('12');
    expect(screen.getByText(/https:\/\/www\.chess\.com\/game\/live\/123/i)).toBeInTheDocument();
    expect(screen.getByText(/endgame_blunder/i)).toBeInTheDocument();
  });

  it('renders N/A context when inventory has no recent updates', async () => {
    getDataInventoryMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      counts: {
        games_count: 0,
        analyses_count: 0,
        move_evaluations_count: 0,
        critical_mistakes_count: 0,
        puzzle_sessions_count: 0,
      },
      latest_updates: {
        last_game_import: null,
        last_analysis_update: null,
        last_mistake_update: null,
      },
    });

    render(
      <MemoryRouter>
        <DataInventoryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getDataInventoryMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('inventory-games-count')).toHaveTextContent('0');
    expect(screen.getByTestId('inventory-analyses-count')).toHaveTextContent('0');
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('deletes selected datasets and refreshes inventory view', async () => {
    const user = userEvent.setup();

    getDataInventoryMock
      .mockResolvedValueOnce({
        generated_at: '2026-02-11T00:00:00.000Z',
        counts: {
          games_count: 24,
          analyses_count: 12,
          move_evaluations_count: 580,
          critical_mistakes_count: 35,
          puzzle_sessions_count: 8,
        },
        latest_updates: {
          last_game_import: null,
          last_analysis_update: null,
          last_mistake_update: null,
        },
      })
      .mockResolvedValueOnce({
        generated_at: '2026-02-11T00:10:00.000Z',
        counts: {
          games_count: 24,
          analyses_count: 8,
          move_evaluations_count: 460,
          critical_mistakes_count: 17,
          puzzle_sessions_count: 1,
        },
        latest_updates: {
          last_game_import: null,
          last_analysis_update: null,
          last_mistake_update: null,
        },
      });

    deleteStoredDatasetsMock.mockResolvedValue({
      deleted_datasets: ['analyses', 'puzzle_sessions'],
      deleted_counts: {
        games_count: 0,
        analyses_count: 4,
        move_evaluations_count: 120,
        critical_mistakes_count: 18,
        puzzle_sessions_count: 7,
        user_mistake_summaries_count: 3,
      },
      remaining_counts: {
        games_count: 24,
        analyses_count: 8,
        move_evaluations_count: 460,
        critical_mistakes_count: 17,
        puzzle_sessions_count: 1,
      },
      deleted_at: '2026-02-11T00:09:00.000Z',
    });

    render(
      <MemoryRouter>
        <DataInventoryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getDataInventoryMock).toHaveBeenCalledTimes(1);
    });

    await user.click(
      screen.getByLabelText(/Supprimer uniquement les analyses/i),
    );
    await user.click(
      screen.getByLabelText(/Supprimer les sessions puzzle stockées/i),
    );
    await user.click(
      screen.getByLabelText(/Je confirme vouloir supprimer ces datasets/i),
    );
    await user.click(
      screen.getByRole('button', {
        name: /Supprimer les datasets sélectionnés/i,
      }),
    );

    await waitFor(() => {
      expect(deleteStoredDatasetsMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        datasetKeys: ['analyses', 'puzzle_sessions'],
      });
    });

    await waitFor(() => {
      expect(getDataInventoryMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByTestId('data-delete-summary')).toHaveTextContent(
      /Datasets supprimés/i,
    );
    expect(screen.getByTestId('inventory-analyses-count')).toHaveTextContent('8');
  });
});
