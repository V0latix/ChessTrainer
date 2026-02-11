import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const { signInWithPasswordMock } = vi.hoisted(() => {
  return {
    signInWithPasswordMock: vi.fn(),
  };
});

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: signInWithPasswordMock,
      },
    },
  };
});

vi.mock('./auth-context', () => {
  return {
    useAuth: () => ({
      isConfigured: true,
      isLoading: false,
      session: null,
    }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
  });

  it('logs in and calls onLoggedIn when session is valid', async () => {
    const user = userEvent.setup();
    const onLoggedIn = vi.fn();

    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: {
          user: { email: 'leo@example.com' },
        },
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <LoginPage onLoggedIn={onLoggedIn} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'leo@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledTimes(1);
      expect(onLoggedIn).toHaveBeenCalledTimes(1);
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'leo@example.com',
      password: 'password123',
    });
  });

  it('shows error when credentials are invalid', async () => {
    const user = userEvent.setup();

    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: {
        message: 'Invalid login credentials',
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'leo@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'bad-password');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
  });
});
