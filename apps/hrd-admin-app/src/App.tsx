import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import { AdminPrivateRoute } from './components/AdminPrivateRoute';
import AdminLayout from './components/AdminLayout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminPrivateRoute />}>
            <Route path="/*" element={
              <AdminLayout>
                <Routes>
                  <Route path="/employees" element={<EmployeeListPage />} />
                  <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="/attendance" element={<AdminAttendancePage />} />
                  <Route path="/" element={<Navigate to="/employees" replace />} />
                </Routes>
              </AdminLayout>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
