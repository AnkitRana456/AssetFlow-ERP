import { lazy } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PublicRoute } from './components/layout/PublicRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy Loaded Auth Views
const LoginPage = lazy(() => import('./pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const UnauthorizedPage = lazy(() => import('./pages/Auth/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));

// Lazy Loaded Dashboard & System Core Views
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrganizationPage = lazy(() => import('./pages/Organization/OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const AssetDirectoryPage = lazy(() => import('./pages/Assets/AssetDirectoryPage').then(m => ({ default: m.AssetDirectoryPage })));
const AssetDetailPage = lazy(() => import('./pages/Assets/AssetDetailPage').then(m => ({ default: m.AssetDetailPage })));
const AllocationDashboardPage = lazy(() => import('./pages/Allocations/AllocationDashboardPage').then(m => ({ default: m.AllocationDashboardPage })));
const AllocationDetailPage = lazy(() => import('./pages/Allocations/AllocationDetailPage').then(m => ({ default: m.AllocationDetailPage })));

// Lazy Loaded Module 7: Bookings Views
const BookingCalendarPage = lazy(() => import('./pages/Bookings/BookingCalendarPage').then(m => ({ default: m.BookingCalendarPage })));
const BookingDetailPage = lazy(() => import('./pages/Bookings/BookingDetailPage').then(m => ({ default: m.BookingDetailPage })));
const BookingAnalyticsPage = lazy(() => import('./pages/Bookings/BookingAnalyticsPage').then(m => ({ default: m.BookingAnalyticsPage })));

// Lazy Loaded Module 9: Auditing Views
const AuditDashboardPage = lazy(() => import('./pages/Auditing/AuditDashboardPage').then(m => ({ default: m.AuditDashboardPage })));
const AuditExecutionPage = lazy(() => import('./pages/Auditing/AuditExecutionPage').then(m => ({ default: m.AuditExecutionPage })));
const AuditReportPage = lazy(() => import('./pages/Auditing/AuditReportPage').then(m => ({ default: m.AuditReportPage })));

// Lazy Loaded Module 10: Final Enterprise Views
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ActivityLogsPage = lazy(() => import('./pages/Logs/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));


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
      <ErrorBoundary>
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
                
                {/* Module 7: Bookings Routes */}
                <Route path="/bookings" element={<BookingCalendarPage />} />
                <Route path="/bookings/:id" element={<BookingDetailPage />} />
                <Route path="/bookings/analytics" element={<BookingAnalyticsPage />} />
                
                {/* Module 9: Auditing Routes */}
                <Route path="/audit" element={<AuditDashboardPage />} />
                <Route path="/audit/:id" element={<AuditExecutionPage />} />
                <Route path="/audit/:id/report" element={<AuditReportPage />} />

                {/* Final Suite Routes */}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/logs" element={<ActivityLogsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Fallback sub-route redirects to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Base URL redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;


