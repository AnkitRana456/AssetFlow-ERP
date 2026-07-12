import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../../store/useAuthStore';

export function PublicRoute() {
  const { accessToken } = useAuthStore();

  // If already logged in, redirect to dashboard
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
