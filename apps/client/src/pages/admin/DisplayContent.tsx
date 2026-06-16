import React, { useState, useRef } from 'react';
import {
  useDisplayContent, useUploadDisplayContent,
  useUpdateDisplayContent, useDeleteDisplayContent,
  useReorderDisplayContent,
} from '@/hooks/useApi';
import {
  Upload, Trash2, X, Loader2, Image, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, MonitorPlay, Clock, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = API_URL.replace('/api', '');

export default function DisplayContent() {
  const { data: items, isLoading } = useDisplayContent();
  const uploadMutation = useUploadDisplayContent();
  const updateMutation = useUpdateDisplayContent();
  const deleteMutation = useDeleteDisplayContent();
  const reorderMutation = useReorderDisplayContent();

  const [showUpload, setShowUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDuration, setUploadDuration] = useState('12');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select an image');
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', uploadTitle || selectedFile.name);
    formData.append('displayDuration', uploadDuration);
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success('Content uploaded successfully');
      resetUploadForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadTitle('');
    setUploadDuration('12');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleActive = async (item: any) => {
    try {
      await updateMutation.mutateAsync({ id: item._id, isActive: !item.isActive });
      toast.success(item.isActive ? 'Content disabled' : 'Content enabled');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Content deleted');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (!items) return;
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    try {
      await reorderMutation.mutateAsync(newItems.map((i: any) => i._id));
    } catch {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Display Content</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage slideshow content for TV displays</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary shrink-0">
          <Upload className="w-4 h-4" /> Upload Image
        </button>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
        </div>
      ) : !items?.length ? (
        <div className="card">
          <div className="empty-state py-16">
            <MonitorPlay className="empty-state-icon" />
            <p className="empty-state-title">No display content yet</p>
            <p className="empty-state-subtitle">Upload images to create a slideshow for TV displays</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary mt-4">
              <Upload className="w-4 h-4" /> Upload First Image
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any, index: number) => (
            <div key={item._id} className={`card overflow-hidden transition-opacity ${!item.isActive ? 'opacity-60' : ''}`}>
              {/* Image Preview */}
              <div className="relative aspect-video bg-surface-100 dark:bg-surface-700 overflow-hidden">
                <img
                  src={`${BASE_URL}${item.imageUrl}`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).classList.add('hidden'); }}
                />
                {/* Order badge */}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                {/* Status badge */}
                <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded ${
                  item.isActive
                    ? 'bg-success-500 text-white'
                    : 'bg-surface-500 text-white'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white truncate">{item.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.displayDuration}s</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                  <button onClick={() => toggleActive(item)}
                    className="p-1.5 rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors"
                    title={item.isActive ? 'Disable' : 'Enable'} aria-label={item.isActive ? 'Disable content' : 'Enable content'}>
                    {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => moveItem(index, 'up')} disabled={index === 0}
                    className="p-1.5 rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors disabled:opacity-30"
                    title="Move up" aria-label="Move up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}
                    className="p-1.5 rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 transition-colors disabled:opacity-30"
                    title="Move down" aria-label="Move down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setShowDeleteConfirm(item._id)}
                    className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-400 hover:text-danger-600 transition-colors"
                    title="Delete" aria-label="Delete content">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetUploadForm} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up">
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">Upload Display Content</h2>
                <p className="text-xs text-surface-500 mt-0.5">Supported: JPG, PNG, WebP (max 10MB)</p>
              </div>
              <button onClick={resetUploadForm} className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain rounded" />
                ) : (
                  <>
                    <Image className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                    <p className="text-sm text-surface-500">Click to select an image</p>
                    <p className="text-xs text-surface-400 mt-1">JPG, PNG, or WebP</p>
                  </>
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
                <input type="text" value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="form-input" placeholder="Display content title" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                  Display Duration (seconds)
                </label>
                <input type="number" min="5" max="120" value={uploadDuration}
                  onChange={(e) => setUploadDuration(e.target.value)}
                  className="form-input" />
              </div>

              <div className="flex gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                <button type="button" onClick={resetUploadForm} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={uploadMutation.isPending || !selectedFile} className="btn-primary flex-1 justify-center">
                  {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Delete Content</h3>
                <p className="text-xs text-surface-500 mt-0.5">This will permanently remove the image.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteMutation.isPending} className="btn-danger flex-1 justify-center">
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
