import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Building2, Eye, EyeOff, Loader2, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ViewerLogin() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const user = data.data.user;
      
      login(data.data.token, user);
      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        if (user.role === 'superadmin' || user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/viewer');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-surface-900 px-10 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary-700 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">RoomSync</p>
            <p className="text-xs text-surface-400 leading-tight">Enterprise Scheduling</p>
          </div>
        </div>

        {/* Center content */}
        <div>
          <div className="w-14 h-14 rounded-xl bg-primary-700/20 border border-primary-700/30 flex items-center justify-center mb-6">
            <CalendarRange className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Your Personal<br />Schedule Board
          </h2>
          <p className="text-surface-400 text-sm leading-relaxed max-w-xs">
            Sign in to view your upcoming lectures, meetings, and assigned training sessions in real time.
          </p>
        </div>

        {/* Bottom */}
        <p className="text-xs text-surface-600">
          © {new Date().getFullYear()} RoomSync. General Edition.
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50 dark:bg-surface-900">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-md bg-primary-700 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-surface-900 dark:text-white">RoomSync</p>
              <p className="text-xs text-surface-500">Enterprise Scheduling</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Sign In</h1>
            <p className="text-sm text-surface-500 mt-1">Viewer Portal — Sign in to view your schedule</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-md bg-danger-50 border border-danger-200 text-danger-700 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="viewer-email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email Address
              </label>
              <input
                id="viewer-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn('form-input', error && 'form-input-error')}
                placeholder="user@company.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="viewer-password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="viewer-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn('form-input pr-10', error && 'form-input-error')}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="viewer-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-200 dark:border-surface-700 flex flex-col gap-2 items-center">
            <p className="text-xs text-surface-400 mt-2">
              Default: <span className="font-mono">viewer@scheduler.com</span> /&nbsp;
              <span className="font-mono">Viewer@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
