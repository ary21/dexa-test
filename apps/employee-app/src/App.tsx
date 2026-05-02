import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AttendancePage from './pages/AttendancePage';
import SummaryPage from './pages/SummaryPage';
import { PrivateRoute } from './components/PrivateRoute';
import MainLayout from './components/MainLayout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route
              element={
                <MainLayout>
                  {/* Children rendered via nested <Outlet> inside MainLayout */}
                  {/* We use a wrapper approach: */}
                  <Routes>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/summary" element={<SummaryPage />} />
                    <Route path="/" element={<Navigate to="/profile" replace />} />
                  </Routes>
                </MainLayout>
              }
              path="/*"
            />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
