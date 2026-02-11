import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const { signOutMock, deleteAccountFromApiMock } = vi.hoisted(() => {
  return {
    signOutMock: vi.fn(),
    deleteAccountFromApiMock: vi.fn(),
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
