import { Navigate, Route, Routes } from 'react-router-dom';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
