import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function isAdminTokenValid(): boolean {
  const token = localStorage.getItem('admin_access_token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now && payload.role === 'ADMIN';
  } catch {
    return false;
  }
}

export function AdminPrivateRoute() {
  return isAdminTokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
}
