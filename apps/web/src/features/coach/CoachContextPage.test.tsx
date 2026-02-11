import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachContextPage } from './CoachContextPage';

const { getCoachStudentsMock, selectCoachStudentContextMock } = vi.hoisted(() => {
  return {
    getCoachStudentsMock: vi.fn(),
    selectCoachStudentContextMock: vi.fn(),
  };
});

vi.mock('../../lib/coach-context', () => {
  return {
    getCoachStudents: getCoachStudentsMock,
    selectCoachStudentContext: selectCoachStudentContextMock,
    storeSelectedCoachContext: vi.fn(),
    readSelectedCoachContext: vi.fn().mockReturnValue(null),
  };
});

vi.mock('../auth/auth-context', () => {
  return {
    useAuth: () => ({
      session: {
        access_token: 'access-token-1',
        user: {
          email: 'coach@example.com',
        },
      },
      isLoading: false,
      isConfigured: true,
    }),
  };
});

describe('CoachContextPage', () => {
  beforeEach(() => {
    getCoachStudentsMock.mockReset();
    selectCoachStudentContextMock.mockReset();
  });

  it('loads authorized students list', async () => {
    getCoachStudentsMock.mockResolvedValue({
      coach_user_id: 'coach-1',
      students: [
        {
          student_user_id: 'student-1',
          email: 'leo@example.com',
          role: 'user',
          chess_com_usernames: ['leoChess'],
          last_game_import_at: '2026-02-11T10:00:00.000Z',
          granted_at: '2026-02-10T10:00:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter>
        <CoachContextPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getCoachStudentsMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
      });
    });

    expect(screen.getByText(/leo@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/leoChess/i)).toBeInTheDocument();
  });

  it('selects one student context', async () => {
    const user = userEvent.setup();

    getCoachStudentsMock.mockResolvedValue({
      coach_user_id: 'coach-1',
      students: [
        {
          student_user_id: 'student-1',
          email: 'leo@example.com',
          role: 'user',
          chess_com_usernames: ['leoChess'],
          last_game_import_at: '2026-02-11T10:00:00.000Z',
          granted_at: '2026-02-10T10:00:00.000Z',
        },
      ],
    });

    selectCoachStudentContextMock.mockResolvedValue({
      context_id: 'coach-1:student-1',
      coach_user_id: 'coach-1',
      student: {
        student_user_id: 'student-1',
        email: 'leo@example.com',
        role: 'user',
        chess_com_usernames: ['leoChess'],
        last_game_import_at: '2026-02-11T10:00:00.000Z',
        granted_at: '2026-02-10T10:00:00.000Z',
      },
      selected_at: '2026-02-11T11:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <CoachContextPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/leo@example.com/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Ouvrir ce contexte/i }));

    await waitFor(() => {
      expect(selectCoachStudentContextMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        studentUserId: 'student-1',
      });
    });

    expect(screen.getByTestId('coach-selected-context')).toHaveTextContent(
      'coach-1:student-1',
    );
  });

  it('shows API authorization errors', async () => {
    getCoachStudentsMock.mockRejectedValue(
      new Error('Coach students fetch failed (403): forbidden'),
    );

    render(
      <MemoryRouter>
        <CoachContextPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Coach students fetch failed \(403\): forbidden/i),
      ).toBeInTheDocument();
    });
  });
});
