import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

const { signUpMock } = vi.hoisted(() => {
  return {
    signUpMock: vi.fn(),
  };
});

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: signUpMock,
      },
    },
  };
});

vi.mock('./auth-context', () => {
  return {
    useAuth: () => ({
      isConfigured: true,
    }),
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    signUpMock.mockReset();
  });

  it('blocks signup when age confirmation is missing', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'leo@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(signUpMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Tu dois confirmer que tu as au moins 16 ans pour créer un compte.'),
    ).toBeTruthy();
  });

  it('creates account and calls onRegistered when a session is returned', async () => {
    const user = userEvent.setup();
    const onRegistered = vi.fn();

    signUpMock.mockResolvedValue({
      data: {
        session: {
          user: { email: 'leo@example.com' },
        },
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <RegisterPage onRegistered={onRegistered} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'leo@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledTimes(1);
      expect(onRegistered).toHaveBeenCalledTimes(1);
    });

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'leo@example.com',
        password: 'password123',
        options: expect.objectContaining({
          data: expect.objectContaining({
            age_confirmed: true,
          }),
        }),
      }),
    );
  });
});
