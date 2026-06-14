import React, { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useResetPassword } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
  Plus, Edit2, ShieldAlert, KeyRound, Search, X, Loader2,
  CheckCircle2, XCircle, UserPlus, Users as UsersIcon, Check, Copy, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormState {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'superadmin' | 'admin' | 'viewer';
  isActive: boolean;
  password?: string;
}

export default function Users() {
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [showModal, setShowModal]       = useState(false);
  const [editingUser, setEditingUser]   = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<any>(null);
  const [copied, setCopied]             = useState(false);

  const { data: usersData, isLoading }  = useUsers(search, page);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const resetMutation  = useResetPassword();

  const users = usersData?.data || [];
  const totalPages = usersData?.totalPages || 1;

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'viewer',
    isActive: true,
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'viewer',
      isActive: true,
      password: '',
    });
    setEditingUser(null);
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Valid email is required';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    if (!form.department.trim()) errors.department = 'Department is required';
    if (!editingUser && (!form.password || form.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingUser) {
        const payload: any = {
          id: editingUser._id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await updateMutation.mutateAsync(payload);
        toast.success('User updated successfully');
      } else {
        await createMutation.mutateAsync(form as any);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      await updateMutation.mutateAsync({
        id: user._id,
        isActive: !user.isActive,
      });
      toast.success(`User ${!user.isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      const result = await resetMutation.mutateAsync(user._id);
      setTempPassword(result.temporaryPassword);
      setShowResetModal(user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            User Management
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage users, adjust roles, and reset credentials</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-14 text-center">
          <UsersIcon className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-sm font-medium text-surface-500">No users found</p>
          <p className="text-xs text-surface-400 mt-1">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700 text-sm">
                {users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-surface-900 dark:text-white">
                      {u.name}
                    </td>
                    <td className="px-5 py-3.5 text-surface-600 dark:text-surface-400">
                      <div className="text-xs font-mono">{u.email}</div>
                      <div className="text-xs mt-0.5">{u.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-surface-600 dark:text-surface-400">
                      {u.department}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'text-xs px-2.5 py-0.5 rounded-full font-medium inline-block',
                        u.role === 'superadmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : u.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Viewer'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={cn(
                          'badge cursor-pointer hover:opacity-80 transition-opacity',
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800'
                        )}
                        title={u.isActive ? 'Click to disable' : 'Click to enable'}
                      >
                        {u.isActive ? (
                          <><CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3 text-danger-600 dark:text-danger-400" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-surface-500 font-mono">
                      {formatDate(u.lastLogin)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-surface-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-surface-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors inline-flex"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="p-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 text-surface-400 hover:text-purple-700 dark:hover:text-purple-400 transition-colors inline-flex"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-surface-500">
                Page <strong className="text-surface-700 dark:text-surface-300">{page}</strong> of{' '}
                <strong className="text-surface-700 dark:text-surface-300">{totalPages}</strong>
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Add / Edit User Modal ══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">
                  {editingUser ? 'Edit User' : 'Add User'}
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  {editingUser ? 'Update user details and roles' : 'Create a new user account'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Full Name <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={cn('form-input', formErrors.name && 'form-input-error')}
                  placeholder="John Doe"
                />
                {formErrors.name && <p className="mt-1 text-xs text-danger-600">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Email Address <span className="text-danger-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={cn('form-input', formErrors.email && 'form-input-error')}
                  placeholder="john@company.com"
                />
                {formErrors.email && <p className="mt-1 text-xs text-danger-600">{formErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Phone Number <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={cn('form-input', formErrors.phone && 'form-input-error')}
                  placeholder="+1-555-123-4567"
                />
                {formErrors.phone && <p className="mt-1 text-xs text-danger-600">{formErrors.phone}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Department <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={cn('form-input', formErrors.department && 'form-input-error')}
                  placeholder="e.g. Computer Science, HR"
                />
                {formErrors.department && <p className="mt-1 text-xs text-danger-600">{formErrors.department}</p>}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  Role <span className="text-danger-500">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e: any) => setForm({ ...form, role: e.target.value })}
                  className="form-input"
                >
                  <option value="viewer">Viewer / User</option>
                  <option value="admin">Admin / Scheduler</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Password (Only required on creation, optional on edit) */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  {editingUser ? 'New Password (Optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={cn('form-input', formErrors.password && 'form-input-error')}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  required={!editingUser}
                />
                {formErrors.password && <p className="mt-1 text-xs text-danger-600">{formErrors.password}</p>}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1 justify-center">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Reset Password Success Modal ══════════ */}
      {showResetModal && tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowResetModal(null); setTempPassword(null); }} />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Temporary Password Generated</h3>
                <p className="text-xs text-surface-500 mt-0.5">Password has been reset for {showResetModal.name}.</p>
              </div>
            </div>

            <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-between mb-5">
              <span className="font-mono text-base font-bold select-all tracking-wide text-primary-700 dark:text-primary-400">
                {tempPassword}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-700"
                title="Copy Password"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2 items-start bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-xs mb-5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Please copy this temporary password and provide it to the user. They will be forced to change it on their next login.
              </p>
            </div>

            <button
              onClick={() => { setShowResetModal(null); setTempPassword(null); }}
              className="btn-primary w-full justify-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
