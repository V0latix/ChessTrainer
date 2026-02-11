import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const { signOutMock } = vi.hoisted(() => {
  return {
    signOutMock: vi.fn(),
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

vi.mock('./auth-context', () => {
  return {
    useAuth: () => ({
      session: {
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
});
