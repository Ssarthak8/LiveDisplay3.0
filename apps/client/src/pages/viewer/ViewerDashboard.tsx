import { useTodaySchedules, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuthStore } from '@/stores/authStore';
import {
  Clock, MapPin, User, Calendar, DoorOpen,
  Loader2, CheckCircle2, XCircle, Users, Building2,
} from 'lucide-react';

export default function ViewerDashboard() {
  useSocketEvents();
  const { user } = useAuthStore();
  const { data: todayData, isLoading } = useTodaySchedules();
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

  const getProgress = (start: string, end: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startDate = new Date(`${today}T${start}`);
    const endDate = new Date(`${today}T${end}`);
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0] || 'Viewer'}
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">{dateStr}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success-500" />
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{ongoingSchedules.length}</p>
            <p className="text-xs text-surface-500">Ongoing</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{upcomingSchedules.length}</p>
            <p className="text-xs text-surface-500">Upcoming</p>
          </div>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-surface-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{completedSchedules.length}</p>
            <p className="text-xs text-surface-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Today's Lectures — Primary Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Today's Lectures</span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">
            {todaySchedules.length}
          </span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="card">
            <div className="empty-state py-12">
              <Calendar className="empty-state-icon" />
              <p className="empty-state-title">No lectures scheduled today</p>
              <p className="empty-state-subtitle">Check back later for updates</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ongoing first, then upcoming, then completed */}
            {[...ongoingSchedules, ...upcomingSchedules, ...completedSchedules].map((schedule: any) => {
              const room = typeof schedule.roomId === 'object' ? schedule.roomId : null;
              const isOngoing = schedule.status === 'ongoing';
              const isUpcoming = schedule.status === 'upcoming';
              const statusCls = isOngoing ? 'lecture-card-ongoing' : isUpcoming ? 'lecture-card-upcoming' : 'lecture-card-completed';

              return (
                <div key={schedule._id} className={`lecture-card ${statusCls} animate-fade-in`}>
                  {/* Status + Type */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      isOngoing
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : isUpcoming
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                    }`}>
                      {isOngoing && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                    <span className="text-xs text-surface-400">{schedule.type}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[0.9375rem] font-semibold text-surface-900 dark:text-white leading-snug mb-2">
                    {schedule.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      <User className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                      <span>{schedule.faculty}</span>
                    </div>
                    {room && (
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                        <span>{room.roomNumber} · {room.building}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      <Clock className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                      <span className="tabular-nums">{formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}</span>
                    </div>
                  </div>

                  {/* Progress bar for ongoing */}
                  {isOngoing && (
                    <div className="mt-3 pt-2 border-t border-surface-100 dark:border-surface-700">
                      <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(getProgress(schedule.startTime, schedule.endTime))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full transition-all duration-1000"
                          style={{ width: `${getProgress(schedule.startTime, schedule.endTime)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Room Information */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label">Room Information</span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs font-bold">
            {(rooms || []).length}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(rooms || []).map((room: any) => {
            const occupied = ongoingRoomIds.has(room._id);
            const activeEvent = occupied
              ? ongoingSchedules.find((s: any) => {
                  const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
                  return rid === room._id;
                })
              : null;

            return (
              <div key={room._id} className="card p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <DoorOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className={`badge text-xs ${
                    occupied
                      ? 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800'
                      : 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800'
                  }`}>
                    {occupied ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {occupied ? 'In Use' : 'Free'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">{room.roomNumber}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-surface-400">
                  <Building2 className="w-3 h-3" />
                  <span>{room.building}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-surface-400">
                  <Users className="w-3 h-3" />
                  <span>{room.capacity} seats</span>
                </div>
                {activeEvent && (
                  <p className="text-xs text-danger-600 dark:text-danger-400 mt-2 truncate">
                    {activeEvent.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
