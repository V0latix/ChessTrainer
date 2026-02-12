import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { CoachContextPage } from '../features/coach/CoachContextPage';
import { CoachReviewPage } from '../features/coach/CoachReviewPage';
import { DataInventoryPage } from '../features/data-inventory/DataInventoryPage';
import { PuzzlePage } from '../features/puzzles/PuzzlePage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { ProgressTrendsPage } from '../features/progress/ProgressTrendsPage';

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
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress/trends"
        element={
          <ProtectedRoute>
            <ProgressTrendsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data/inventory"
        element={
          <ProtectedRoute>
            <DataInventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/context"
        element={
          <ProtectedRoute>
            <CoachContextPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/review"
        element={
          <ProtectedRoute>
            <CoachReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
