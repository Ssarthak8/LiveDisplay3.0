import React from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import ViewerLayout from '@/components/layout/ViewerLayout';

// Admin Pages
import AdminLogin from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Schedules from '@/pages/admin/Schedules';
import Rooms from '@/pages/admin/Rooms';
import Analytics from '@/pages/admin/Analytics';
import AuditLogs from '@/pages/admin/AuditLogs';
import Users from '@/pages/admin/Users';
import DisplayMedia from '@/pages/admin/DisplayMedia';
import Announcements from '@/pages/admin/Announcements';
import ChangePassword from '@/pages/admin/ChangePassword';

// Viewer Pages
import ViewerHome from '@/pages/viewer/ViewerHome';
import ViewerDashboard from '@/pages/viewer/ViewerDashboard';
import ViewerLogin from '@/pages/viewer/Login';

// TV Display
import TVDisplay from '@/pages/tv/TVDisplay';

// Protected Route with Role and Password Change Check
function ProtectedRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: string | string[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const isAccessingAdmin = location.pathname.startsWith('/admin');
    return <Navigate to={isAccessingAdmin ? '/admin/login' : '/login'} replace />;
  }

  // Force password change except on the change-password page itself
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Authorize specific roles
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(user.role)) {
      if (user.role === 'superadmin' || user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/viewer" replace />;
    }
  }

  return <>{children}</>;
}

// Redirect if already logged in
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated && user) {
    if (user.mustChangePassword && location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
    if (user.role === 'superadmin' || user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/viewer" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Viewer Layout (public schedule board + viewer dashboard)
  {
    element: <ViewerLayout />,
    children: [
      { path: '/', element: <ViewerHome /> },
      {
        path: '/viewer',
        element: (
          <ProtectedRoute requireRole="viewer">
            <ViewerDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Admin Login (primary)
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <AdminLogin />
      </PublicOnlyRoute>
    ),
  },
  // Viewer Login
  {
    path: '/viewer/login',
    element: (
      <PublicOnlyRoute>
        <ViewerLogin />
      </PublicOnlyRoute>
    ),
  },
  // Admin Login
  {
    path: '/admin/login',
    element: (
      <PublicOnlyRoute>
        <AdminLogin />
      </PublicOnlyRoute>
    ),
  },
  // Force change password
  {
    path: '/change-password',
    element: (
      <ProtectedRoute>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },
  // Admin Portal (protected)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireRole={['superadmin', 'admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'schedules', element: <Schedules /> },
      { path: 'rooms', element: <Rooms /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'audit-logs', element: <AuditLogs /> },
      {
        path: 'users',
        element: (
          <ProtectedRoute requireRole="superadmin">
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'display-media',
        element: (
          <ProtectedRoute requireRole={['superadmin', 'admin']}>
            <DisplayMedia />
          </ProtectedRoute>
        ),
      },
      {
        path: 'announcements',
        element: (
          <ProtectedRoute requireRole={['superadmin', 'admin']}>
            <Announcements />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // TV Display (public, no layout)
  {
    path: '/tv',
    element: <TVDisplay />,
  },
]);
