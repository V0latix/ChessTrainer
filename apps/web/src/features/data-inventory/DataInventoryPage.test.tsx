import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataInventoryPage } from './DataInventoryPage';

const { getDataInventoryMock } = vi.hoisted(() => {
  return {
    getDataInventoryMock: vi.fn(),
  };
});

vi.mock('../../lib/data-inventory', () => {
  return {
    getDataInventory: getDataInventoryMock,
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
});
