import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useTodaySchedules } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { ROOM_MASTER_DATA, RoomNames, RoomName } from '@room-scheduler/shared-types';
import {
  Plus, Edit2, Trash2, DoorOpen, Users, Building2,
  X, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormState { roomNumber: string; building: string; capacity: string; }

function FormSection({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="section-label">{title}</span>
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
    </div>
  );
}

export default function Rooms() {
  useSocketEvents();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const { data: rooms, isLoading }  = useRooms();
  const { data: todayData }         = useTodaySchedules();

  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const [showModal,        setShowModal]        = useState(false);
  const [editingRoom,      setEditingRoom]      = useState<any>(null);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState<string | null>(null);
  const [formErrors,       setFormErrors]       = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>({ roomNumber: '', building: '', capacity: '' });

  const todaySchedules = todayData?.data || [];
  const ongoingEvents  = todaySchedules.filter((s: any) => s.status === 'ongoing');

  /* Check if room is currently occupied */
  const isOccupied = (roomId: string): boolean =>
    ongoingEvents.some((s: any) => {
      const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
      return rid === roomId;
    });

  const getOccupyingEvent = (roomId: string): any =>
    ongoingEvents.find((s: any) => {
      const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
      return rid === roomId;
    });

  /* ── Counts ── */
  const totalRooms     = rooms?.length ?? 0;
  const occupiedCount  = rooms?.filter((r: any) => isOccupied(r._id)).length ?? 0;
  const availableCount = totalRooms - occupiedCount;

  /* ── Form helpers ── */
  const resetForm = () => { setForm({ roomNumber: '', building: '', capacity: '' }); setEditingRoom(null); setFormErrors({}); };
  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit   = (room: any) => {
    setEditingRoom(room);
    setForm({ roomNumber: room.roomNumber, building: room.building, capacity: String(room.capacity) });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!form.roomNumber.trim()) errors.roomNumber = 'Room number is required';
    if (!form.building.trim())   errors.building   = 'Building name is required';
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
      errors.capacity = 'Valid capacity is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...form, capacity: Number(form.capacity) };
    try {
      if (editingRoom) {
        await updateMutation.mutateAsync({ id: editingRoom._id, ...payload });
        toast.success('Room updated successfully');
      } else {
        await createMutation.mutateAsync(payload as Record<string, unknown>);
        toast.success('Room created successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Room deleted');
      setShowDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const inputClass = (field: keyof FormState) =>
    cn('form-input', formErrors[field] && 'form-input-error');

  /* ════════════════════ Render ════════════════════ */
  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Room Management</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage meeting rooms and spaces</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        )}
      </div>

      {/* ── Summary chips ── */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-medium">
            <DoorOpen className="w-3.5 h-3.5 text-primary-700 dark:text-primary-400" />
            <span className="text-surface-600 dark:text-surface-400">Total:</span>
            <span className="font-bold text-surface-900 dark:text-white">{totalRooms}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-400">Available:</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">{availableCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-xs font-medium">
            <XCircle className="w-3.5 h-3.5 text-danger-600 dark:text-danger-400" />
            <span className="text-danger-700 dark:text-danger-400">Occupied:</span>
            <span className="font-bold text-danger-800 dark:text-danger-300">{occupiedCount}</span>
          </div>
        </div>
      )}

      {/* ── Room Grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
        </div>
      ) : !rooms?.length ? (
        <div className="card p-14 text-center">
          <DoorOpen className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-sm font-medium text-surface-500">No rooms registered yet</p>
          <p className="text-xs text-surface-400 mt-1">Add your first room to get started</p>
          <button onClick={openCreate} className="btn-primary mt-5 mx-auto">
              <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms?.map((room: any) => {
            const occupied     = isOccupied(room._id);
            const activeEvent  = getOccupyingEvent(room._id);
            return (
              <div key={room._id}
                className="card overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors animate-fade-in">
                {/* Top accent line */}
                <div className={cn('h-1', occupied ? 'bg-danger-500' : 'bg-primary-700')} />

                <div className="p-5">
                  {/* Icon + Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <DoorOpen className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                    </div>
                    {isSuperAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(room)}
                        className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-surface-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                        title="Edit room" aria-label="Edit room">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(room._id)}
                        className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                        title="Delete room" aria-label="Delete room">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    )}
                  </div>

                  {/* Room info */}
                  <h3 className="text-base font-bold text-surface-900 dark:text-white">{room.roomNumber}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-surface-500">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{room.building}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-surface-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{room.capacity} seats</span>
                    </div>
                  </div>

                  {/* Availability status */}
                  <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                    {occupied ? (
                      <div>
                        <span className="badge bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800">
                          <XCircle className="w-3 h-3" /> Occupied
                        </span>
                        {activeEvent && (
                          <p className="text-xs text-surface-500 mt-1.5 truncate">
                            {activeEvent.title}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ Add / Edit Modal ══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">
                  {editingRoom ? 'Edit Room' : 'Add Room'}
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  {editingRoom ? 'Update room information' : 'Register a new room or space'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div className="space-y-4">
                <FormSection title="Room Information" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Room Name <span className="text-danger-500">*</span>
                  </label>
                  <select
                    required
                    value={form.roomNumber}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const presetCapacity = selectedVal ? String(ROOM_MASTER_DATA[selectedVal as RoomName]) : '';
                      setForm({
                        ...form,
                        roomNumber: selectedVal,
                        capacity: presetCapacity,
                      });
                    }}
                    className={inputClass('roomNumber')}
                  >
                    <option value="">Select a Room</option>
                    {RoomNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {formErrors.roomNumber && <p className="mt-1 text-xs text-danger-600">{formErrors.roomNumber}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Building / Block <span className="text-danger-500">*</span>
                  </label>
                  <input type="text" required value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    className={inputClass('building')} placeholder="e.g. Main Block, Engineering Wing" />
                  {formErrors.building && <p className="mt-1 text-xs text-danger-600">{formErrors.building}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <FormSection title="Capacity" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Seating Capacity <span className="text-surface-500">(Auto-filled)</span>
                  </label>
                  <input type="number" required min="1" max="1000" value={form.capacity}
                    className={inputClass('capacity')} placeholder="Select a room to set capacity" disabled />
                  {formErrors.capacity && <p className="mt-1 text-xs text-danger-600">{formErrors.capacity}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1 justify-center">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Delete Confirmation ══════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Delete Room</h3>
                <p className="text-xs text-surface-500 mt-0.5">Rooms with existing schedules cannot be deleted.</p>
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
