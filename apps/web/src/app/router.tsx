import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { PuzzlePage } from '../features/puzzles/PuzzlePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/puzzle"
        element={
          <ProtectedRoute>
            <PuzzlePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
