import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const {
  signOutMock,
  deleteAccountFromApiMock,
  listChessComCandidateGamesMock,
  importSelectedChessComGamesMock,
} = vi.hoisted(() => {
  return {
    signOutMock: vi.fn(),
    deleteAccountFromApiMock: vi.fn(),
    listChessComCandidateGamesMock: vi.fn(),
    importSelectedChessComGamesMock: vi.fn(),
  };
});

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signOut: signOutMock,
      },
    },
  };
});

vi.mock('../../lib/account-delete', () => {
  return {
    deleteAccountFromApi: deleteAccountFromApiMock,
  };
});

vi.mock('../../lib/chess-com', () => {
  return {
    listChessComCandidateGames: listChessComCandidateGamesMock,
    importSelectedChessComGames: importSelectedChessComGamesMock,
  };
});

vi.mock('./auth-context', () => {
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

describe('OnboardingPage', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountFromApiMock.mockReset();
    listChessComCandidateGamesMock.mockReset();
    importSelectedChessComGamesMock.mockReset();
  });

  it('logs out and calls onLoggedOut', async () => {
    const user = userEvent.setup();
    const onLoggedOut = vi.fn();

    signOutMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <OnboardingPage onLoggedOut={onLoggedOut} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /se déconnecter/i }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(onLoggedOut).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches chess.com candidate games and displays them as selectable', async () => {
    const user = userEvent.setup();

    listChessComCandidateGamesMock.mockResolvedValue({
      username: 'leo',
      candidate_games: [
        {
          game_url: 'https://www.chess.com/game/live/123',
          period: '2026-02',
          end_time: '2026-02-11T00:00:00.000Z',
          time_class: 'blitz',
          rated: true,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'maxime',
          white_result: 'win',
          black_result: 'checkmated',
          selectable: true,
        },
      ],
      unavailable_periods: [
        {
          period: '2026-01',
          archive_url: 'https://api.chess.com/pub/player/leo/games/2026/01',
          reason: 'archive_unavailable_503',
        },
      ],
      total_candidate_games: 1,
    });

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/pseudo chess.com/i), 'leo');
    await user.click(screen.getByRole('button', { name: /lister mes parties/i }));

    await waitFor(() => {
      expect(listChessComCandidateGamesMock).toHaveBeenCalledWith(
        'access-token-1',
        'leo',
      );
      expect(screen.getByText(/leo vs maxime/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/2026-01 \(archive_unavailable_503\)/i),
    ).toBeInTheDocument();
  });

  it('imports selected games and shows summary', async () => {
    const user = userEvent.setup();

    listChessComCandidateGamesMock.mockResolvedValue({
      username: 'leo',
      candidate_games: [
        {
          game_url: 'https://www.chess.com/game/live/123',
          period: '2026-02',
          end_time: '2026-02-11T00:00:00.000Z',
          time_class: 'blitz',
          rated: true,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'maxime',
          white_result: 'win',
          black_result: 'checkmated',
          selectable: true,
        },
      ],
      unavailable_periods: [],
      total_candidate_games: 1,
    });

    importSelectedChessComGamesMock.mockResolvedValue({
      username: 'leo',
      selected_count: 1,
      imported_count: 1,
      already_existing_count: 0,
      failed_count: 0,
      failures: [],
    });

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/pseudo chess.com/i), 'leo');
    await user.click(screen.getByRole('button', { name: /lister mes parties/i }));

    await waitFor(() => {
      expect(screen.getByText(/leo vs maxime/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox', { name: /leo vs maxime/i }));
    await user.click(screen.getByRole('button', { name: /importer la sélection/i }));

    await waitFor(() => {
      expect(importSelectedChessComGamesMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        username: 'leo',
        selectedGameUrls: ['https://www.chess.com/game/live/123'],
      });
      expect(screen.getByText(/Import terminé pour leo/i)).toBeInTheDocument();
    });
  });

  it('blocks delete account until confirmation is checked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /supprimer mon compte/i }));

    expect(deleteAccountFromApiMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Confirme la suppression du compte avant de continuer.'),
    ).toBeInTheDocument();
  });

  it('deletes account and logs out when confirmed', async () => {
    const user = userEvent.setup();
    const onLoggedOut = vi.fn();

    deleteAccountFromApiMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <OnboardingPage onLoggedOut={onLoggedOut} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByLabelText(/je confirme vouloir supprimer définitivement mon compte/i),
    );
    await user.click(screen.getByRole('button', { name: /supprimer mon compte/i }));

    await waitFor(() => {
      expect(deleteAccountFromApiMock).toHaveBeenCalledWith('access-token-1');
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(onLoggedOut).toHaveBeenCalledTimes(1);
    });
  });
});
