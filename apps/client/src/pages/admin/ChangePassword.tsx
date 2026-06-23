import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Building2, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);

  const { user, setUser, logout }             = useAuthStore();
  const navigate                              = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password updated successfully');
      
      // Update local state
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
        
        // Redirect to appropriate dashboard
        if (updatedUser.role === 'superadmin' || updatedUser.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/viewer');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // If they choose to log out instead
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface-50 dark:bg-surface-900">
      <div className="w-full max-w-sm card p-8 space-y-6 shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary-700 flex items-center justify-center shadow-md">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mt-3">Change Your Password</h2>
          <p className="text-xs text-surface-500 max-w-xs">
            For security, you must update your password before accessing the scheduling system dashboard.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2.5 rounded-md bg-danger-50 border border-danger-200 text-danger-700 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-400 text-xs animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input text-sm py-2"
              placeholder="Enter current password"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input text-sm py-2"
              placeholder="Min 6 characters"
              required
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input text-sm py-2 pr-10"
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1 justify-center py-2"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center py-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
