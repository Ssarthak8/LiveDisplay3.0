import { useDashboardStats, useTodaySchedules, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import {
  DoorOpen, Calendar, Clock, TrendingUp, Users,
  Loader2, CheckCircle2, XCircle, ArrowUpRight,
} from 'lucide-react';

export default function Dashboard() {
  useSocketEvents();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayData, isLoading: todayLoading } = useTodaySchedules();
  const { data: rooms } = useRooms();

  const todaySchedules = todayData?.data || [];
  const ongoingSchedules = todaySchedules.filter((s: any) => s.status === 'ongoing');
  const upcomingSchedules = todaySchedules.filter((s: any) => s.status === 'upcoming');
  const completedSchedules = todaySchedules.filter((s: any) => s.status === 'completed');

  const ongoingRoomIds = new Set(
    ongoingSchedules.map((s: any) => typeof s.roomId === 'object' ? s.roomId?._id : s.roomId)
  );

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { cls: string; label: string }> = {
      ongoing:   { cls: 'status-ongoing',   label: 'Ongoing' },
      upcoming:  { cls: 'status-upcoming',  label: 'Upcoming' },
      completed: { cls: 'status-completed', label: 'Completed' },
    };
    const c = config[status] || config.completed;
    return (
      <span className={`badge ${c.cls}`}>
        {status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />}
        {c.label}
      </span>
    );
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">Overview of scheduling activity and room status</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="kpi-card kpi-card-blue">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-value">{stats?.totalRooms ?? 0}</p>
              <p className="kpi-label">Total Rooms</p>
            </div>
            <div className="kpi-icon kpi-icon-blue">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="kpi-trend kpi-trend-up">
            <ArrowUpRight className="w-3 h-3" />
            <span>Active</span>
          </div>
        </div>

        <div className="kpi-card kpi-card-green">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-value">{stats?.todayTotal ?? 0}</p>
              <p className="kpi-label">Today's Schedules</p>
            </div>
            <div className="kpi-icon kpi-icon-green">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="kpi-trend kpi-trend-up">
            <TrendingUp className="w-3 h-3" />
            <span>{completedSchedules.length} completed</span>
          </div>
        </div>

        <div className="kpi-card kpi-card-emerald">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-value">{stats?.ongoing ?? 0}</p>
              <p className="kpi-label">Ongoing Events</p>
            </div>
            <div className="kpi-icon kpi-icon-emerald">
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-25" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
              </span>
            </div>
          </div>
          <div className="kpi-trend kpi-trend-up">
            <Users className="w-3 h-3" />
            <span>In progress</span>
          </div>
        </div>

        <div className="kpi-card kpi-card-amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="kpi-value">{stats?.upcoming ?? 0}</p>
              <p className="kpi-label">Upcoming Events</p>
            </div>
            <div className="kpi-icon kpi-icon-amber">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="kpi-trend kpi-trend-up">
            <ArrowUpRight className="w-3 h-3" />
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Schedule (wider column) */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="section-label">Today's Schedule</span>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">
                {todaySchedules.length}
              </span>
            </div>
          </div>

          {todayLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-state-icon" />
              <p className="empty-state-title">No events today</p>
              <p className="empty-state-subtitle">Schedule an event to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedules.slice(0, 8).map((schedule: any) => {
                    const room = typeof schedule.roomId === 'object' ? schedule.roomId : null;
                    return (
                      <tr key={schedule._id}>
                        <td>
                          <p className="font-semibold text-surface-900 dark:text-white text-[0.8125rem]">{schedule.title}</p>
                          <p className="text-xs text-surface-400 mt-0.5">{schedule.type}</p>
                        </td>
                        <td className="text-sm text-surface-600 dark:text-surface-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-surface-400" />
                            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                          </div>
                        </td>
                        <td>
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{room?.roomNumber || '—'}</p>
                          <p className="text-xs text-surface-400">{room?.building}</p>
                        </td>
                        <td>{getStatusBadge(schedule.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Room Availability */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <span className="section-label">Room Status</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                <CheckCircle2 className="w-3 h-3" /> {(rooms || []).filter((r: any) => !ongoingRoomIds.has(r._id)).length}
              </span>
              <span className="flex items-center gap-1 text-danger-600 dark:text-danger-400">
                <XCircle className="w-3 h-3" /> {(rooms || []).filter((r: any) => ongoingRoomIds.has(r._id)).length}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {(rooms || []).map((room: any) => {
              const occupied = ongoingRoomIds.has(room._id);
              const activeEvent = occupied
                ? ongoingSchedules.find((s: any) => {
                    const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
                    return rid === room._id;
                  })
                : null;
              return (
                <div
                  key={room._id}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-lg border transition-colors ${
                    occupied
                      ? 'border-danger-200 dark:border-danger-900/40 bg-danger-50/50 dark:bg-danger-900/10'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{room.roomNumber}</p>
                    <p className="text-xs text-surface-400">{room.building} · {room.capacity} seats</p>
                    {activeEvent && (
                      <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5 truncate max-w-[160px]">
                        {activeEvent.title}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${occupied
                    ? 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800'
                    : 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800'
                  }`}>
                    {occupied ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {occupied ? 'Occupied' : 'Available'}
                  </span>
                </div>
              );
            })}
            {(!rooms || rooms.length === 0) && (
              <div className="empty-state py-8">
                <DoorOpen className="empty-state-icon" />
                <p className="empty-state-title">No rooms yet</p>
                <p className="empty-state-subtitle">Add rooms from the Rooms page</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
