import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  useSchedules, useCreateSchedule, useUpdateSchedule,
  useDeleteSchedule, useRooms,
} from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { formatDate, formatTime, getStatusClass, getEventTypeColor, cn } from '@/lib/utils';
import {
  Plus, Search, X, Edit2, Trash2, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2, Calendar,
  ChevronUp, ChevronDown, ChevronsUpDown,
  User, MapPin, Clock, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CalendarView from '@/components/calendar/CalendarView';

/* ── Types ── */
type SortField = 'title' | 'faculty' | 'room' | 'date' | 'status' | '';
type SortDir   = 'asc' | 'desc';

interface ConflictData {
  roomNumber?: string;
  building?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  faculty?: string;
  roomCoordinator?: string;
  coordinatorMobileNumber?: string;
  createdBy?: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
  };
}

interface FormState {
  title: string; type: string; faculty: string;
  roomId: string; date: string; startTime: string;
  endTime: string; description: string;
  roomCoordinator: string; coordinatorMobileNumber: string;
}

/* ── Sort icon helper ── */
function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 text-surface-400 ml-1 inline" />;
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-primary-600 ml-1 inline" />
    : <ChevronDown className="w-3 h-3 text-primary-600 ml-1 inline" />;
}

/* ── Section divider inside modal ── */
function FormSection({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="section-label">{title}</span>
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
    </div>
  );
}

/* ── Conflict Detail Row ── */
function ConflictRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 text-surface-500 shrink-0">{label}</span>
      <span className="font-medium text-surface-900 dark:text-surface-100 break-all">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Schedules() {
  useSocketEvents();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  /* ── Filter state ── */
  const [viewMode,     setViewMode]     = useState<'list' | 'calendar'>('list');
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [filterRoom,   setFilterRoom]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [page,         setPage]         = useState(1);

  /* ── Sort state (client-side) ── */
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');

  /* ── Modal / form state ── */
  const [showModal,        setShowModal]        = useState(false);
  const [editingSchedule,  setEditingSchedule]  = useState<any>(null);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState<string | null>(null);
  const [conflictData,     setConflictData]     = useState<ConflictData | null>(null);
  const [formErrors,       setFormErrors]       = useState<Partial<FormState>>({});

  const [form, setForm] = useState<FormState>({
    title: '', type: 'Lecture', faculty: '', roomId: '',
    date: '', startTime: '', endTime: '', description: '',
    roomCoordinator: '', coordinatorMobileNumber: '',
  });

  /* ── API ── */
  const filters = {
    search:  search  || undefined,
    type:    filterType  || undefined,
    roomId:  filterRoom  || undefined,
    status:  filterStatus|| undefined,
    date:    filterDate  || undefined,
    page,
    limit:   viewMode === 'calendar' ? 1000 : 10,
  };

  const { data: schedulesData, isLoading } = useSchedules(filters);
  const { data: rooms }                    = useRooms();
  const createMutation  = useCreateSchedule();
  const updateMutation  = useUpdateSchedule();
  const deleteMutation  = useDeleteSchedule();

  const schedules  = schedulesData?.data || [];
  const totalPages = schedulesData?.totalPages || 1;

  /* ── Client-side sort ── */
  const sortedSchedules = useMemo(() => {
    if (!sortField) return schedules;
    return [...schedules].sort((a: any, b: any) => {
      let aVal = '';
      let bVal = '';
      switch (sortField) {
        case 'title':   aVal = a.title?.toLowerCase();                   bVal = b.title?.toLowerCase(); break;
        case 'faculty': aVal = a.faculty?.toLowerCase();                 bVal = b.faculty?.toLowerCase(); break;
        case 'room':    aVal = a.roomId?.roomNumber?.toLowerCase() || ''; bVal = b.roomId?.roomNumber?.toLowerCase() || ''; break;
        case 'date':    aVal = a.date || '';                              bVal = b.date || ''; break;
        case 'status':  aVal = a.status || '';                           bVal = b.status || ''; break;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [schedules, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  /* ── Form helpers ── */
  const resetForm = () => {
    setForm({
      title: '', type: 'Lecture', faculty: '', roomId: '', date: '', startTime: '', endTime: '', description: '',
      roomCoordinator: '', coordinatorMobileNumber: '',
    });
    setEditingSchedule(null);
    setConflictData(null);
    setFormErrors({});
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setForm({
      title:      schedule.title,
      type:       schedule.type,
      faculty:    schedule.faculty,
      roomId:     typeof schedule.roomId === 'object' ? schedule.roomId._id : schedule.roomId,
      date:       schedule.date,
      startTime:  schedule.startTime,
      endTime:    schedule.endTime,
      description:schedule.description || '',
      roomCoordinator: schedule.roomCoordinator || '',
      coordinatorMobileNumber: schedule.coordinatorMobileNumber || '',
    });
    setConflictData(null);
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!form.title.trim())    errors.title    = 'Event title is required';
    if (!form.faculty.trim())  errors.faculty  = 'Faculty / presenter is required';
    if (!form.roomId)          errors.roomId   = 'Please select a room';
    if (!form.date)            errors.date     = 'Date is required';
    if (!form.startTime)       errors.startTime = 'Start time is required';
    if (!form.endTime)         errors.endTime  = 'End time is required';
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      errors.endTime = 'End time must be after start time';
    if (!form.roomCoordinator.trim()) errors.roomCoordinator = 'Room Coordinator is required';
    if (!form.coordinatorMobileNumber.trim()) {
      errors.coordinatorMobileNumber = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(form.coordinatorMobileNumber)) {
      errors.coordinatorMobileNumber = 'Mobile Number must be a 10-digit number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictData(null);
    if (!validateForm()) return;
    try {
      if (editingSchedule) {
        await updateMutation.mutateAsync({ id: editingSchedule._id, ...form } as any);
        toast.success('Schedule updated successfully');
      } else {
        await createMutation.mutateAsync(form as any);
        toast.success('Schedule created successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.conflict) setConflictData(resp.conflict);
      else toast.error(resp?.message || 'Failed to save schedule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Schedule deleted');
      setShowDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const inputClass = (field: keyof FormState) =>
    cn('form-input', formErrors[field] && 'form-input-error');

  /* ── Sortable header cell ── */
  const Th = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      onClick={() => field && handleSort(field)}
    >
      {children}
      {field && <SortIcon field={field} active={sortField === field} dir={sortDir} />}
    </th>
  );

  /* ════════════════════ Render ════════════════════ */
  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Schedule Management</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage room bookings and events</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex border border-surface-300 dark:border-surface-600 rounded-md overflow-hidden text-xs font-medium">
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-3 py-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >List</button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn('px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
                viewMode === 'calendar'
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >Calendar</button>
          </div>
          <button id="create-schedule-btn" onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title or faculty…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9"
            />
          </div>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="form-input w-auto">
            <option value="">All Types</option>
            <option value="Lecture">Lecture</option>
            <option value="Meeting">Meeting</option>
            <option value="Training">Training</option>
            <option value="Seminar">Seminar</option>
          </select>
          <select value={filterRoom} onChange={(e) => { setFilterRoom(e.target.value); setPage(1); }} className="form-input w-auto">
            <option value="">All Rooms</option>
            {rooms?.map((r: any) => (
              <option key={r._id} value={r._id}>{r.roomNumber} ({r.building})</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="form-input w-auto">
            <option value="">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            className="form-input w-auto"
          />
          {(search || filterType || filterRoom || filterStatus || filterDate) && (
            <button
              onClick={() => { setSearch(''); setFilterType(''); setFilterRoom(''); setFilterStatus(''); setFilterDate(''); setPage(1); }}
              className="btn-secondary py-2 px-3 text-xs"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {viewMode === 'list' ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <Th field="title">Event Name</Th>
                    <Th field="faculty">Faculty / Presenter</Th>
                    <Th field="room">Room</Th>
                    <Th field="date">Date &amp; Time</Th>
                    <Th field="status">Status</Th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Room Coordinator</th>
                    <th className="text-left px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Created By</th>
                    {isSuperAdmin && <th className="text-right px-5 py-3 font-semibold text-surface-500 text-xs uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" />
                    </td></tr>
                  ) : sortedSchedules.length === 0 ? (
                    <tr><td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-12">
                      <div className="empty-state">
                        <Calendar className="empty-state-icon" />
                        <p className="empty-state-title">No schedules found</p>
                        <p className="empty-state-subtitle">Try adjusting your filters or create a new schedule</p>
                      </div>
                    </td></tr>
                  ) : (
                    sortedSchedules.map((s: any) => (
                      <tr key={s._id} className="animate-fade-in">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-surface-900 dark:text-white text-sm">{s.title}</p>
                          <span className={cn('mt-1 inline-block text-xs px-2 py-0.5 rounded font-medium', getEventTypeColor(s.type))}>{s.type}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                            <span className="text-sm text-surface-700 dark:text-surface-300">{s.faculty}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-sm text-surface-900 dark:text-white">{s.roomId?.roomNumber || 'N/A'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-surface-400" />
                            <span className="text-xs text-surface-500">{s.roomId?.building || ''}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-surface-900 dark:text-white">{formatDate(s.date)}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-surface-400" />
                            <span className="text-xs text-surface-500 tabular-nums">{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('badge', getStatusClass(s.status))}>
                            {s.status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-surface-900 dark:text-white">{s.roomCoordinator || '—'}</p>
                          <p className="text-xs text-surface-500">{s.coordinatorMobileNumber || ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-surface-700 dark:text-surface-300">{s.createdBy?.name || '—'}</p>
                          <p className="text-xs text-surface-400">{s.createdBy?.email || ''}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1 row-actions">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-surface-400 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                              title="Edit" aria-label="Edit schedule"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(s._id)}
                              className="p-1.5 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                              title="Delete" aria-label="Delete schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200 dark:border-surface-700">
                <p className="text-xs text-surface-500">
                  Showing <span className="font-semibold text-surface-700 dark:text-surface-300">{((page - 1) * 10) + 1}–{Math.min(page * 10, schedulesData?.total || 0)}</span> of{' '}
                  <span className="font-semibold text-surface-700 dark:text-surface-300">{schedulesData?.total || 0}</span> results
                </p>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                    className="pagination-btn" aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button key={pageNum} onClick={() => setPage(pageNum)}
                        className={cn('pagination-btn', page === pageNum && 'active')}>
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="pagination-btn cursor-default">…</span>}
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                    className="pagination-btn" aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <CalendarView
          schedules={schedules}
          rooms={rooms || []}
          isAdmin={true}
          onSelectSlot={(date, startTime, roomId) => {
            resetForm();
            setForm((prev) => ({
              ...prev, date, startTime, roomId,
              endTime: (() => {
                const [h, m] = startTime.split(':').map(Number);
                const endH = h + 1 + (m + 30 >= 60 ? 1 : 0);
                const endM = (m + 30) % 60;
                return `${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
              })(),
            }));
            setShowModal(true);
          }}
        />
      )}

      {/* ══════════ Create / Edit Modal ══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white">
                  {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  {editingSchedule ? 'Update booking details' : 'Create a new room booking'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict Alert */}
            {conflictData && (
              <div className="mx-6 mt-4 p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                      Scheduling Conflict Detected
                    </p>
                    <div className="space-y-1.5">
                      <ConflictRow label="Faculty"          value={conflictData.faculty} />
                      <ConflictRow label="Room Coordinator" value={conflictData.roomCoordinator} />
                      <ConflictRow label="Mobile Number"    value={conflictData.coordinatorMobileNumber} />
                      <ConflictRow label="Room"             value={conflictData.roomNumber ? `${conflictData.roomNumber}${conflictData.building ? ` (${conflictData.building})` : ''}` : undefined} />
                      <ConflictRow label="Date"             value={conflictData.date ? formatDate(conflictData.date) : undefined} />
                      <ConflictRow label="Time"
                        value={conflictData.startTime && conflictData.endTime
                          ? `${formatTime(conflictData.startTime)} – ${formatTime(conflictData.endTime)}`
                          : undefined}
                      />
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      Please choose a different room or time slot.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Section 1 — Event Information */}
              <div className="space-y-4">
                <FormSection title="Event Information" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Event Title <span className="text-danger-500">*</span>
                  </label>
                  <input type="text" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputClass('title')} placeholder="e.g. Advanced Manufacturing Seminar" />
                  {formErrors.title && <p className="mt-1 text-xs text-danger-600">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Event Type <span className="text-danger-500">*</span>
                  </label>
                  <select required value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="form-input">
                    <option value="Lecture">Lecture</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Training">Training</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              {/* Section 2 — Faculty / Presenter */}
              <div className="space-y-4">
                <FormSection title="Presenter / Faculty" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Faculty / Presenter Name <span className="text-danger-500">*</span>
                  </label>
                  <input type="text" required value={form.faculty}
                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    className={inputClass('faculty')} placeholder="Full name" />
                  {formErrors.faculty && <p className="mt-1 text-xs text-danger-600">{formErrors.faculty}</p>}
                </div>
              </div>

              {/* Section 3 — Room & Time */}
              <div className="space-y-4">
                <FormSection title="Room &amp; Time" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Room <span className="text-danger-500">*</span>
                  </label>
                  <select required value={form.roomId}
                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                    className={cn('form-input', formErrors.roomId && 'form-input-error')}>
                    <option value="">Select a room…</option>
                    {rooms?.map((r: any) => (
                      <option key={r._id} value={r._id}>
                        {r.roomNumber} — {r.building} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                  {formErrors.roomId && <p className="mt-1 text-xs text-danger-600">{formErrors.roomId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Date <span className="text-danger-500">*</span>
                  </label>
                  <input type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass('date')} />
                  {formErrors.date && <p className="mt-1 text-xs text-danger-600">{formErrors.date}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                      Start Time <span className="text-danger-500">*</span>
                    </label>
                    <input type="time" required value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className={inputClass('startTime')} />
                    {formErrors.startTime && <p className="mt-1 text-xs text-danger-600">{formErrors.startTime}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                      End Time <span className="text-danger-500">*</span>
                    </label>
                    <input type="time" required value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className={inputClass('endTime')} />
                    {formErrors.endTime && <p className="mt-1 text-xs text-danger-600">{formErrors.endTime}</p>}
                  </div>
                </div>
              </div>

              {/* Section 4 — Room Coordinator Details */}
              <div className="space-y-4">
                <FormSection title="Room Coordinator Details" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                      Room Coordinator <span className="text-danger-500">*</span>
                    </label>
                    <input type="text" required value={form.roomCoordinator}
                      onChange={(e) => setForm({ ...form, roomCoordinator: e.target.value })}
                      className={inputClass('roomCoordinator')} placeholder="Coordinator name" />
                    {formErrors.roomCoordinator && <p className="mt-1 text-xs text-danger-600">{formErrors.roomCoordinator}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                      Mobile Number <span className="text-danger-500">*</span>
                    </label>
                    <input type="text" required value={form.coordinatorMobileNumber}
                      onChange={(e) => setForm({ ...form, coordinatorMobileNumber: e.target.value })}
                      className={inputClass('coordinatorMobileNumber')} placeholder="10-digit number" />
                    {formErrors.coordinatorMobileNumber && <p className="mt-1 text-xs text-danger-600">{formErrors.coordinatorMobileNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Section 5 — Notes */}
              <div className="space-y-4">
                <FormSection title="Additional Notes" />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                    Description <span className="text-surface-400 font-normal">(optional)</span>
                  </label>
                  <textarea rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-input resize-none"
                    placeholder="Additional details, agenda, requirements…" />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                <button type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1 justify-center">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
              <p className="text-center text-xs text-surface-400">
                Conflicts are automatically detected on submission
              </p>
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
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Delete Schedule</h3>
                <p className="text-xs text-surface-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
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
