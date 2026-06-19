import React, { useState } from 'react';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import {
  Megaphone,
  Trash2,
  X,
  Loader2,
  Plus,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Announcements() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const { data: items, isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'Normal' | 'Important'>('Normal');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementContent.trim()) {
      toast.error('Please enter announcement content.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        content: announcementContent.trim(),
        priority: announcementPriority,
      });
      toast.success('Announcement created successfully.');
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create announcement.');
    }
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setAnnouncementContent('');
    setAnnouncementPriority('Normal');
  };

  const toggleActive = async (item: any) => {
    try {
      await updateMutation.mutateAsync({
        id: item._id,
        isActive: !item.isActive,
      });
      toast.success(item.isActive ? 'Announcement disabled' : 'Announcement enabled');
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const togglePriority = async (item: any) => {
    try {
      const newPriority = item.priority === 'Important' ? 'Normal' : 'Important';
      await updateMutation.mutateAsync({
        id: item._id,
        priority: newPriority,
      });
      toast.success(`Priority updated to ${newPriority}`);
    } catch {
      toast.error('Failed to update priority.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Announcement deleted.');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete announcement.');
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            Announcements Board
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Manage text-based priority notifications for TV display screens
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
        <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-500" />
        <span>
          Important announcements are displayed first on the TV Screen. Updates sync live immediately.
        </span>
      </div>

      {/* Announcements Table/List */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
        </div>
      ) : !items?.length ? (
        <div className="card">
          <div className="empty-state py-16">
            <Megaphone className="empty-state-icon text-surface-300 dark:text-surface-600" />
            <p className="empty-state-title">No announcements yet</p>
            <p className="empty-state-subtitle">Create a text announcement to publish on TV screens</p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary mt-4 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Announcement
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th className="w-1/2">Announcement Content</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Created By</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr
                    key={item._id}
                    className={`transition-opacity ${!item.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="font-medium text-surface-900 dark:text-white max-w-xs break-words">
                      {item.content}
                    </td>
                    <td>
                      <button
                        onClick={() => isAdmin && togglePriority(item)}
                        disabled={!isAdmin}
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-colors shrink-0 ${
                          item.priority === 'Important'
                            ? 'bg-danger-100 text-danger-750 border border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-surface-700 dark:text-slate-300 dark:border-surface-600'
                        } ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        {item.priority}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`badge text-[10px] uppercase font-semibold ${
                          item.isActive
                            ? 'bg-success-100 text-success-800 border-success-200 dark:bg-success-900/20 dark:text-success-400'
                            : 'bg-surface-200 text-surface-500 border-surface-300 dark:bg-surface-800 dark:text-surface-400'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-surface-500 font-mono">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="text-xs text-surface-500">
                      {item.createdBy?.name || 'System'}
                    </td>
                    {isAdmin && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 row-actions">
                          <button
                            onClick={() => toggleActive(item)}
                            className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-white transition-colors cursor-pointer"
                            title={item.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {item.isActive ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(item._id)}
                            className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-500 hover:text-danger-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetForm}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 animate-slide-up">
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">
                  New Announcement
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Publish a new priority alert on TV Display screens
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                  Content <span className="text-danger-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="form-input resize-none"
                  placeholder="e.g. AI Workshop starts tomorrow at 10:00 AM."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={announcementPriority}
                  onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                  className="form-input"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1 justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1 justify-center cursor-pointer disabled:opacity-40"
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                  Delete Announcement
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  This action is permanent and removes the notice.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1 justify-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center cursor-pointer"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
