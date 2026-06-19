import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  ClipboardList,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Tv,
  ExternalLink,
  Building2,
  Users,
  MonitorPlay,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/admin/schedules',   icon: Calendar,        label: 'Schedules',   end: false },
  { to: '/admin/rooms',       icon: DoorOpen,        label: 'Rooms',       end: false },
  { to: '/admin/analytics',   icon: BarChart3,       label: 'Analytics',   end: false },
  { to: '/admin/audit-logs',  icon: ClipboardList,   label: 'Audit Logs',  end: false },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700',
          'transform transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700">
          <Link
            to="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 min-w-0 group hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md bg-primary-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-surface-900 dark:text-white leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                RoomSync
              </p>
              <p className="text-xs text-surface-500 leading-tight">Scheduling System</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-label px-3 pb-2 pt-1">Main Menu</p>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active')
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin/users"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'active')
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              Users
            </NavLink>
          )}

          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <>
              <NavLink
                to="/admin/display-media"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn('nav-item', isActive && 'active')
                }
              >
                <MonitorPlay className="w-4 h-4 shrink-0" />
                Display Media
              </NavLink>
              <NavLink
                to="/admin/announcements"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn('nav-item', isActive && 'active')
                }
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                Announcements
              </NavLink>
            </>
          )}

          <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700">
            <p className="section-label px-3 pb-2">External Views</p>
            <a
              href="/tv"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item flex items-center"
            >
              <Tv className="w-4 h-4 shrink-0" />
              <span className="flex-1">TV Display</span>
              <ExternalLink className="w-3 h-3 text-surface-400" />
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item flex items-center"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="flex-1">Viewer Portal</span>
              <ExternalLink className="w-3 h-3 text-surface-400" />
            </a>
          </div>
        </nav>

        {/* User Footer */}
        <div className="px-3 py-3 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-surface-500 truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="btn-secondary flex-1 justify-center text-xs py-1.5"
              title="Toggle theme"
            >
              {theme === 'dark'
                ? <><Sun className="w-3.5 h-3.5" />Light</>
                : <><Moon className="w-3.5 h-3.5" />Dark</>
              }
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                         bg-danger-50 text-danger-700 border border-danger-100
                         hover:bg-danger-100 transition-colors
                         dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30 dark:hover:bg-danger-900/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-surface-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
              RoomSync
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
