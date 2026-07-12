import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/Auth/LoginPage';
import { UnauthorizedPage } from './pages/Auth/UnauthorizedPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { OrganizationPage } from './pages/Organization/OrganizationPage';
import { AssetDirectoryPage } from './pages/Assets/AssetDirectoryPage';
import { AssetDetailPage } from './pages/Assets/AssetDetailPage';
import { AllocationDashboardPage } from './pages/Allocations/AllocationDashboardPage';
import { AllocationDetailPage } from './pages/Allocations/AllocationDetailPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PublicRoute } from './components/layout/PublicRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest Only Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          
          {/* Fallback Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Auth Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetDirectoryPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/allocations" element={<AllocationDashboardPage />} />
              <Route path="/allocations/:id" element={<AllocationDetailPage />} />
              <Route path="/organization" element={<OrganizationPage />} />
              
              {/* Fallback sub-route redirects to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Base URL redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
