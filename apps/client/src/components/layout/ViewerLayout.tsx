import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { Building2, Moon, Sun, Tv, Lock } from 'lucide-react';

export default function ViewerLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLogoLink = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'superadmin' || user.role === 'admin') return '/admin/dashboard';
    return '/viewer';
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <Link
              to={getLogoLink()}
              className="flex items-center gap-3 group hover:opacity-85 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 rounded-md bg-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-surface-900 dark:text-white leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                  RoomSync
                </p>
                <p className="text-xs text-surface-500 leading-tight hidden sm:block">
                  Enterprise Scheduling System
                </p>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="/tv"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">TV Mode</span>
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700
                           text-surface-600 dark:text-surface-400 transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" />
                  : <Moon className="w-4 h-4" />
                }
              </button>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={user?.role === 'viewer' ? '/viewer' : '/admin/dashboard'}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-danger-50 text-danger-700 border border-danger-100 hover:bg-danger-100 transition-colors dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-200 dark:border-surface-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-surface-400">
            © {new Date().getFullYear()} RoomSync — Real-Time Room Scheduling &amp; Display System
          </p>
        </div>
      </footer>
    </div>
  );
}
