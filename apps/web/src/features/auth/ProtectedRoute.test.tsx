import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from './auth-context';
import { ProtectedRoute } from './ProtectedRoute';

function renderWithAuth(value: AuthContextValue) {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <p>Onboarding page</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to login when session is missing', () => {
    renderWithAuth({
      session: null,
      isLoading: false,
      isConfigured: true,
    });

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('allows access when session exists', () => {
    renderWithAuth({
      session: {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'id-1',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          email: 'leo@example.com',
          created_at: '2026-02-11T00:00:00.000Z',
        },
      } as AuthContextValue['session'],
      isLoading: false,
      isConfigured: true,
    });

    expect(screen.getByText('Onboarding page')).toBeInTheDocument();
  });
});
