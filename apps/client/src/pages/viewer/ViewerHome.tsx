import React, { useState } from 'react';
import { useSchedules, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { formatDate, formatTime, getStatusClass, getEventTypeColor, cn } from '@/lib/utils';
import { Search, Calendar, Clock, MapPin, User, Loader2, LayoutGrid, LayoutList } from 'lucide-react';
import CalendarView from '@/components/calendar/CalendarView';

export default function ViewerHome() {
  useSocketEvents();

  const [viewMode,     setViewMode]     = useState<'grid' | 'calendar'>('grid');
  const [search,       setSearch]       = useState('');
  const [filterRoom,   setFilterRoom]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [page,         setPage]         = useState(1);

  const { data: rooms }           = useRooms();
  const { data: schedulesData, isLoading } = useSchedules({
    search:  search       || undefined,
    roomId:  filterRoom   || undefined,
    status:  filterStatus || undefined,
    date:    filterDate   || undefined,
    page,
    limit:   viewMode === 'calendar' ? 1000 : 12,
  });

  const schedules  = schedulesData?.data || [];
  const totalPages = schedulesData?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Hero ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-surface-900 dark:text-white">Live Schedule Board</h1>
          </div>
          <p className="text-sm text-surface-500">
            Real-time room schedule display ·{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex border border-surface-300 dark:border-surface-600 rounded-md overflow-hidden text-xs font-medium shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-700')}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
              viewMode === 'calendar'
                ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-700')}
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events or faculty…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9"
            />
          </div>
          <select value={filterRoom} onChange={(e) => { setFilterRoom(e.target.value); setPage(1); }} className="form-input w-auto">
            <option value="">All Rooms</option>
            {rooms?.map((r: any) => (
              <option key={r._id} value={r._id}>{r.roomNumber}</option>
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
        </div>
      </div>

      {/* ── Content ── */}
      {viewMode === 'grid' ? (
        <>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="card p-14 text-center">
              <Calendar className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-sm font-medium text-surface-500">No events found</p>
              <p className="text-xs text-surface-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((s: any, i: number) => (
                <div
                  key={s._id}
                  className={cn(
                    'card overflow-hidden animate-fade-in',
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Left status border */}
                  <div className={cn(
                    'h-1',
                    s.status === 'ongoing'   ? 'bg-emerald-500'
                    : s.status === 'upcoming' ? 'bg-primary-700'
                    : 'bg-surface-300 dark:bg-surface-600'
                  )} />

                  <div className="p-5">
                    {/* Card Header — Status + Type */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded font-medium', getEventTypeColor(s.type))}>
                        {s.type}
                      </span>
                      <span className={cn('badge', getStatusClass(s.status))}>
                        {s.status === 'ongoing' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                      </span>
                    </div>

                    {/* Title — public safe */}
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-3 line-clamp-2">
                      {s.title}
                    </h3>

                    {/* Details — VIEWER PRIVACY: only show faculty, room, date, time */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                        <User className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                        <span className="truncate">{s.faculty}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                        <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                        <span>{s.roomId?.roomNumber || 'N/A'}{s.roomId?.building ? ` — ${s.roomId.building}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                        <Calendar className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                        <span>{formatDate(s.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400">
                        <Clock className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                        <span className="tabular-nums">{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
                      </div>
                    </div>
                    {/* NO creator name, email, phone, or audit info shown to viewer */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="btn-secondary py-1.5 px-4 text-xs disabled:opacity-40">
                Previous
              </button>
              <span className="text-xs text-surface-500">
                Page <strong className="text-surface-700 dark:text-surface-300">{page}</strong> of{' '}
                <strong className="text-surface-700 dark:text-surface-300">{totalPages}</strong>
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="btn-secondary py-1.5 px-4 text-xs disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <CalendarView
          schedules={schedules}
          rooms={rooms || []}
          isAdmin={false}
        />
      )}
    </div>
  );
}
