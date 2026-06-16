import React, { useState, useRef } from 'react';
import {
  useDisplayMedia,
  useUploadDisplayMedia,
  useUpdateDisplayMedia,
  useDeleteDisplayMedia,
  useReorderDisplayMedia,
} from '@/hooks/useApi';
import { useAuthStore } from '@/stores/authStore';
import {
  Upload, Trash2, X, Loader2, Image, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, MonitorPlay, Clock, Eye, EyeOff, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = API_URL.replace('/api', '');

export default function DisplayMedia() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const { data: items, isLoading } = useDisplayMedia();
  const uploadMutation = useUploadDisplayMedia();
  const updateMutation = useUpdateDisplayMedia();
  const deleteMutation = useDeleteDisplayMedia();
  const reorderMutation = useReorderDisplayMedia();

  const [showUpload, setShowUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10 MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds the 10 MB limit.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validate file format
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('Unsupported file format. Only JPG, JPEG, PNG, and WebP are allowed.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Operation forbidden: insufficient permissions.');
      return;
    }
    if (!selectedFile) return toast.error('Please select an image file to upload.');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', uploadTitle || selectedFile.name);

    try {
      await uploadMutation.mutateAsync(formData);
      toast.success('Media uploaded successfully.');
      resetUploadForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleActive = async (item: any) => {
    if (!isSuperAdmin) {
      toast.error('Operation forbidden: insufficient permissions.');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: item._id, isActive: !item.isActive });
      toast.success(item.isActive ? 'Media disabled' : 'Media enabled');
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) {
      toast.error('Operation forbidden: insufficient permissions.');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Media deleted.');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete media.');
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (!isSuperAdmin) {
      toast.error('Operation forbidden: insufficient permissions.');
      return;
    }
    if (!items) return;
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;

    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    try {
      await reorderMutation.mutateAsync(newItems.map((i: any) => i._id));
    } catch {
      toast.error('Failed to reorder.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Display Media</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage slideshow posters and banners for digital signage TV displays</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowUpload(true)} className="btn-primary shrink-0 cursor-pointer">
            <Upload className="w-4 h-4" /> Upload Signage Image
          </button>
        )}
      </div>

      {/* Role Notice for Admins */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs text-surface-500 border border-surface-200 dark:border-surface-700">
          <Info className="w-4 h-4 text-primary-500 shrink-0" />
          <span>You have Read-Only view access. Modifying options, uploading new banners, or reordering the sequence requires SuperAdmin permissions.</span>
        </div>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
        </div>
      ) : !items?.length ? (
        <div className="card">
          <div className="empty-state py-16">
            <MonitorPlay className="empty-state-icon" />
            <p className="empty-state-title">No signage media yet</p>
            <p className="empty-state-subtitle">Upload custom college posters or announcements to build a digital slideshow</p>
            {isSuperAdmin && (
              <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 cursor-pointer">
                <Upload className="w-4 h-4" /> Upload First Image
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any, index: number) => (
            <div key={item._id} className={`card overflow-hidden transition-opacity ${!item.isActive ? 'opacity-65' : ''}`}>
              {/* Image Preview */}
              <div className="relative aspect-video bg-surface-100 dark:bg-surface-700 overflow-hidden group">
                <img
                  src={`${BASE_URL}${item.imageUrl}`}
                  alt={item.title}
                  className="w-full h-full object-cover select-none"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '';
                    target.classList.add('hidden');
                  }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                {/* Order badge */}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                  #{index + 1}
                </span>
                {/* Status badge */}
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                  item.isActive
                    ? 'bg-success-500 text-white'
                    : 'bg-surface-500 text-white'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white truncate" title={item.title}>
                  {item.title}
                </h3>
                <p className="text-[10px] text-surface-400 mt-1 truncate">
                  Uploaded by: {item.uploadedBy?.name || 'System'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                  {isSuperAdmin ? (
                    <>
                      <button
                        onClick={() => toggleActive(item)}
                        className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-white transition-colors cursor-pointer"
                        title={item.isActive ? 'Disable' : 'Enable'}
                        aria-label={item.isActive ? 'Disable media' : 'Enable media'}
                      >
                        {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move up"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-800 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move down"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => setShowDeleteConfirm(item._id)}
                        className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-500 hover:text-danger-600 transition-colors cursor-pointer"
                        title="Delete"
                        aria-label="Delete media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-surface-400">
                      <span>Actions Locked</span>
                      <MonitorPlay className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetUploadForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 animate-slide-up">
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">Upload Signage Media</h2>
                <p className="text-xs text-surface-500 mt-0.5">Supports: JPG, PNG, WebP (Max size: 10MB)</p>
              </div>
              <button onClick={resetUploadForm} className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
              {/* File Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain rounded" />
                ) : (
                  <div className="py-2">
                    <Image className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-600 mb-2 animate-pulse" />
                    <p className="text-sm font-semibold text-surface-600 dark:text-surface-300">Click to select an image</p>
                    <p className="text-xs text-surface-400 mt-1">Recommended: 1920x1080 Landscape</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="form-input"
                  placeholder="Announcements, Welcome Banner, Poster Name..."
                  required
                />
              </div>

              {/* Upload Progress Simulation if uploading */}
              {uploadMutation.isPending && (
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-xs text-primary-600 dark:text-primary-400 font-semibold">
                    <span>Uploading...</span>
                    <span>Processing</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 animate-[pulse_1.5s_infinite] w-[80%] rounded-full" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <button type="button" onClick={resetUploadForm} className="btn-secondary flex-1 justify-center cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !selectedFile}
                  className="btn-primary flex-1 justify-center cursor-pointer disabled:opacity-40"
                >
                  {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload Poster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Delete Signage Image</h3>
                <p className="text-xs text-surface-500 mt-0.5">This action is permanent and removes the file on disk.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1 justify-center cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center cursor-pointer"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
