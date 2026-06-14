import React, { useMemo } from 'react';
import { useDashboardStats, useTodaySchedules, useAuditLogs, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { formatTime, getStatusClass, getEventTypeColor, cn } from '@/lib/utils';
import {
  DoorOpen,
  Calendar,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  PieChart,
  Activity,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Types ── */
interface ScheduleItem {
  _id: string;
  title: string;
  faculty: string;
  type: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  startTime: string;
  endTime: string;
  date: string;
  roomId?: { _id: string; roomNumber: string; building: string };
}

interface AuditLog {
  _id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  performedBy?: { name: string; email: string };
  scheduleId?: { title: string };
  timestamp: string;
}

interface RoomItem {
  _id: string;
  roomNumber: string;
  building: string;
  capacity: number;
}

/* ── Stat Card ── */
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  description?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, loading, description }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums">
            {loading ? <span className="text-surface-300 dark:text-surface-600">—</span> : value}
          </p>
          {description && (
            <p className="text-xs text-surface-400 mt-1">{description}</p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
export default function Dashboard() {
  useSocketEvents();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayData, isLoading: todayLoading } = useTodaySchedules();
  const { data: roomsData } = useRooms();
  const { data: auditData } = useAuditLogs(1);

  const rooms: RoomItem[]        = roomsData || [];
  const todaySchedules: ScheduleItem[] = (todayData?.data || []) as ScheduleItem[];
  const ongoingEvents   = todaySchedules.filter((s) => s.status === 'ongoing');
  const upcomingEvents  = todaySchedules.filter((s) => s.status === 'upcoming');
  const auditLogs: AuditLog[] = (auditData?.data?.slice(0, 5) || []) as AuditLog[];

  const availableRooms = (stats?.totalRooms ?? 0) - (stats?.ongoingEvents ?? 0);
  const utilizationPct = stats?.totalRooms
    ? Math.round(((stats?.ongoingEvents ?? 0) / stats.totalRooms) * 100)
    : 0;

  /* Room utilization bars */
  const roomUtil = useMemo(() => {
    if (!rooms.length || !todaySchedules.length) return [];
    return rooms
      .map((room) => {
        const roomSchedules = todaySchedules.filter((s) => {
          const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
          return rid === room._id;
        });
        let totalMinutes = 0;
        roomSchedules.forEach((s) => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0) totalMinutes += diff;
        });
        const hours   = totalMinutes / 60;
        const percent = Math.min(Math.round((hours / 8) * 100), 100);
        return { roomNumber: room.roomNumber, building: room.building, percent, hours: hours.toFixed(1), count: roomSchedules.length };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  }, [rooms, todaySchedules]);

  /* Event type donut */
  const eventDistribution = useMemo(() => {
    const dist: Record<string, number> = { Lecture: 0, Meeting: 0, Training: 0, Seminar: 0, total: 0 };
    todaySchedules.forEach((s) => {
      if (s.type in dist) { dist[s.type] = (dist[s.type] as number) + 1; dist.total = (dist.total as number) + 1; }
    });
    return dist;
  }, [todaySchedules]);

  const donutSlices = useMemo(() => {
    const { Lecture, Meeting, Training, Seminar, total } = eventDistribution as Record<string, number>;
    const circumference = 2 * Math.PI * 40;
    if (!total) return [{ type: 'No Bookings', value: 0, color: 'stroke-surface-200 dark:stroke-surface-700', pct: 100, dashArray: `${circumference} ${circumference}`, dashOffset: 0 }];
    const rawSlices = [
      { type: 'Lecture',  value: Lecture,  color: 'stroke-blue-500',    pct: (Lecture  / total) * 100 },
      { type: 'Meeting',  value: Meeting,  color: 'stroke-slate-500',   pct: (Meeting  / total) * 100 },
      { type: 'Training', value: Training, color: 'stroke-amber-500',   pct: (Training / total) * 100 },
      { type: 'Seminar',  value: Seminar,  color: 'stroke-emerald-500', pct: (Seminar  / total) * 100 },
    ].filter((s) => s.value > 0);
    let acc = 0;
    return rawSlices.map((slice) => {
      const dashArray  = `${(slice.pct / 100) * circumference} ${circumference}`;
      const dashOffset = -(acc / 100) * circumference;
      acc += slice.pct;
      return { ...slice, dashArray, dashOffset };
    });
  }, [eventDistribution]);

  const donutLegendColors: Record<string, string> = {
    Lecture: 'bg-blue-500', Meeting: 'bg-slate-400', Training: 'bg-amber-500', Seminar: 'bg-emerald-500',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Overview of today's scheduling activity · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Rooms"
          value={stats?.totalRooms ?? 0}
          icon={DoorOpen}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-700 dark:text-blue-400"
          loading={statsLoading}
          description="Registered rooms"
        />
        <StatCard
          label="Available Now"
          value={availableRooms}
          icon={CheckCircle2}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-700 dark:text-emerald-400"
          loading={statsLoading}
          description="Ready for booking"
        />
        <StatCard
          label="Occupied"
          value={stats?.ongoingEvents ?? 0}
          icon={Zap}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-700 dark:text-amber-400"
          loading={statsLoading}
          description="Currently in use"
        />
        <StatCard
          label="Today's Events"
          value={stats?.totalSchedulesToday ?? 0}
          icon={Calendar}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-700 dark:text-blue-400"
          loading={statsLoading}
          description="Scheduled today"
        />
        <StatCard
          label="Upcoming"
          value={stats?.upcomingEvents ?? 0}
          icon={Clock}
          iconBg="bg-slate-100 dark:bg-slate-700"
          iconColor="text-slate-600 dark:text-slate-300"
          loading={statsLoading}
          description={`${utilizationPct}% utilization`}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room Utilization */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-700 dark:text-primary-400" />
              <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Room Utilization — Today</h2>
            </div>
            <span className="text-xs text-surface-400">Top 5 busiest</span>
          </div>
          {roomUtil.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
              <p className="text-sm text-surface-400">No bookings today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roomUtil.map((r) => (
                <div key={r.roomNumber} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
                      Room {r.roomNumber} — {r.building}
                    </span>
                    <span className="text-xs text-surface-500 tabular-nums">{r.hours}h / {r.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-700 dark:bg-primary-500 transition-all duration-500"
                      style={{ width: `${r.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Type Distribution */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-primary-700 dark:text-primary-400" />
            <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Event Type Breakdown</h2>
          </div>
          {(eventDistribution.total as number) === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <div className="text-center">
                <PieChart className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                <p className="text-sm text-surface-400">No events today</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 flex-1">
              {/* Donut */}
              <div className="relative w-36 h-36 shrink-0">
                <svg className="transform -rotate-90 w-36 h-36" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent"
                    className="stroke-surface-100 dark:stroke-surface-700" strokeWidth="10" />
                  {donutSlices.map((slice, idx) => (
                    <circle key={idx} cx="50" cy="50" r="40" fill="transparent"
                      className={slice.color} strokeWidth="10"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      strokeLinecap={slice.value > 0 ? 'round' : 'butt'}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-surface-900 dark:text-white tabular-nums">
                    {eventDistribution.total as number}
                  </span>
                  <span className="text-xs text-surface-400 font-medium uppercase tracking-wide">Total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2.5 w-full max-w-[180px]">
                {Object.entries(eventDistribution).map(([key, val]) => {
                  if (key === 'total') return null;
                  const total = eventDistribution.total as number;
                  const pct   = total > 0 ? Math.round(((val as number) / total) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2.5 h-2.5 rounded-sm', donutLegendColors[key] || 'bg-slate-400')} />
                        <span className="text-xs text-surface-700 dark:text-surface-300">{key}</span>
                      </div>
                      <span className="text-xs font-semibold text-surface-900 dark:text-white tabular-nums">
                        {val as number} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Events Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ongoing */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Happening Now</h2>
            </div>
            <span className={cn('badge text-xs', ongoingEvents.length > 0 ? 'status-ongoing' : 'status-completed')}>
              {ongoingEvents.length} active
            </span>
          </div>
          {todayLoading ? (
            <p className="text-center py-8 text-sm text-surface-400">Loading…</p>
          ) : ongoingEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Zap className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
              <p className="text-sm text-surface-400">No events in progress</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ongoingEvents.map((event) => (
                <div key={event._id}
                  className="flex items-stretch gap-3 p-3 rounded-md border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{event.faculty} · {event.roomId?.roomNumber || 'N/A'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatTime(event.startTime)} – {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-700 dark:text-primary-400" />
              <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Upcoming Events</h2>
            </div>
            <Link to="/admin/schedules"
              className="flex items-center gap-1 text-xs text-primary-700 dark:text-primary-400 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {todayLoading ? (
            <p className="text-center py-8 text-sm text-surface-400">Loading…</p>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
              <p className="text-sm text-surface-400">No upcoming events today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event._id}
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded', getEventTypeColor(event.type))}>
                    {event.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{event.faculty} · {event.roomId?.roomNumber || 'N/A'}</p>
                  </div>
                  <p className="text-xs font-medium text-surface-600 dark:text-surface-400 tabular-nums shrink-0">
                    {formatTime(event.startTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-700 dark:text-primary-400" />
            <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Recent Activity</h2>
          </div>
          <Link to="/admin/audit-logs"
            className="flex items-center gap-1 text-xs text-primary-700 dark:text-primary-400 hover:underline">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-center py-6 text-sm text-surface-400">No recent activity</p>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
            {auditLogs.map((log) => (
              <div key={log._id} className="flex items-center gap-4 py-3">
                <span className={cn(
                  'inline-flex items-center justify-center w-16 text-xs font-semibold px-2 py-0.5 rounded border',
                  log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    : log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                    : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30'
                )}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-900 dark:text-surface-100">
                    <span className="font-medium">{log.performedBy?.name || 'System'}</span>
                    {' '}{log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted'}{' '}
                    <span className="font-medium">{log.scheduleId?.title || 'a schedule'}</span>
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
