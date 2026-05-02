import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function isTokenValid(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) return false;

  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

// ── AC US-02: Redirect to /login if token invalid/expired ───
export function PrivateRoute() {
  return isTokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
}
