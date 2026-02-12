import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const {
  signOutMock,
  deleteAccountFromApiMock,
  enqueueAnalysisJobsMock,
  getAnalysisJobStatusMock,
  listChessComCandidateGamesMock,
  importSelectedChessComGamesMock,
  reimportChessComGamesMock,
} = vi.hoisted(() => {
  return {
    signOutMock: vi.fn(),
    deleteAccountFromApiMock: vi.fn(),
    enqueueAnalysisJobsMock: vi.fn(),
    getAnalysisJobStatusMock: vi.fn(),
    listChessComCandidateGamesMock: vi.fn(),
    importSelectedChessComGamesMock: vi.fn(),
    reimportChessComGamesMock: vi.fn(),
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

vi.mock('../../lib/analysis-jobs', () => {
  return {
    enqueueAnalysisJobs: enqueueAnalysisJobsMock,
    getAnalysisJobStatus: getAnalysisJobStatusMock,
  };
});

vi.mock('../../lib/chess-com', () => {
  return {
    listChessComCandidateGames: listChessComCandidateGamesMock,
    importSelectedChessComGames: importSelectedChessComGamesMock,
    reimportChessComGames: reimportChessComGamesMock,
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

vi.mock('../puzzles/PuzzleTrainer', () => {
  return {
    PuzzleTrainer: () => <div data-testid="puzzle-trainer-stub" />,
  };
});

describe('OnboardingPage', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountFromApiMock.mockReset();
    enqueueAnalysisJobsMock.mockReset();
    getAnalysisJobStatusMock.mockReset();
    listChessComCandidateGamesMock.mockReset();
    importSelectedChessComGamesMock.mockReset();
    reimportChessComGamesMock.mockReset();
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

  it('reimports recent games incrementally and shows summary', async () => {
    const user = userEvent.setup();

    reimportChessComGamesMock.mockResolvedValue({
      username: 'leo',
      scanned_count: 10,
      imported_count: 3,
      already_existing_count: 7,
      failed_count: 0,
      failures: [],
      unavailable_periods: [
        {
          period: '2026-01',
          archive_url: 'https://api.chess.com/pub/player/leo/games/2026/01',
          reason: 'archive_unavailable_503',
        },
      ],
    });

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/pseudo chess.com/i), 'leo');
    await user.click(
      screen.getByRole('button', { name: /réimporter sans doublons/i }),
    );

    await waitFor(() => {
      expect(reimportChessComGamesMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        username: 'leo',
      });
      expect(screen.getByText(/Réimport terminé pour leo/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Parties scannées: 10/i)).toBeInTheDocument();
    expect(
      screen.getByText(/2026-01 \(archive_unavailable_503\)/i),
    ).toBeInTheDocument();
  });

  it('starts async analysis jobs and shows queue summary', async () => {
    const user = userEvent.setup();

    enqueueAnalysisJobsMock.mockResolvedValue({
      enqueued_count: 4,
      skipped_count: 1,
      jobs: [
        {
          job_id: 'analysis-1',
          game_id: 'game-1',
          status: 'queued',
          queue_job_id: 'queue-1',
          created_at: '2026-02-11T00:00:00.000Z',
        },
      ],
    });
    getAnalysisJobStatusMock.mockResolvedValue({
      job_id: 'analysis-1',
      game_id: 'game-1',
      status: 'completed',
      progress_percent: 100,
      eta_seconds: 0,
      started_at: '2026-02-11T00:00:00.000Z',
      completed_at: '2026-02-11T00:00:10.000Z',
      error_code: null,
      error_message: null,
      updated_at: '2026-02-11T00:00:10.000Z',
    });

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: /démarrer l’analyse asynchrone/i }),
    );

    await waitFor(() => {
      expect(enqueueAnalysisJobsMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
      });
      expect(getAnalysisJobStatusMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        jobId: 'analysis-1',
      });
      expect(screen.getByText(/Analyse lancée/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Jobs créés: 4/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Jobs ignorés \(déjà en cours\): 1/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Progression moyenne: 100%/i)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: /progression moyenne de l’analyse/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Toutes les analyses suivies sont terminées./i),
    ).toBeInTheDocument();
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
