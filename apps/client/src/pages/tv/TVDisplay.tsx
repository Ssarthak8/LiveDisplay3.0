import React, { useEffect, useState, useRef } from 'react';
import { useTodaySchedules, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { formatTime, cn } from '@/lib/utils';
import { Building2, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';

export default function TVDisplay() {
  useSocketEvents();

  const [currentTime,   setCurrentTime]   = useState(new Date());
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socket        = useSocket();

  const { data: todayData } = useTodaySchedules();
  const { data: rooms }     = useRooms();

  const schedules     = todayData?.data || [];
  const ongoingEvents = schedules.filter((s: any) => s.status === 'ongoing');
  const upcomingEvents= schedules.filter((s: any) => s.status === 'upcoming');

  /* Live clock */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Auto-hide cursor */
  useEffect(() => {
    const handleMouseMove = () => {
      setCursorVisible(true);
      if (cursorTimeout.current) clearTimeout(cursorTimeout.current);
      cursorTimeout.current = setTimeout(() => setCursorVisible(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeout.current) clearTimeout(cursorTimeout.current);
    };
  }, []);

  /* Room status helper */
  const getRoomStatus = (roomId: string): any =>
    ongoingEvents.find((s: any) => {
      const rid = typeof s.roomId === 'object' ? s.roomId._id : s.roomId;
      return rid === roomId;
    });

  const clockStr = currentTime.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  });

  return (
    <div
      className={cn(
        'min-h-screen bg-surface-900 text-white flex flex-col',
        cursorVisible ? '' : 'tv-mode'
      )}
    >
      {/* ══════════ Header Bar ══════════ */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-surface-700 shrink-0">
        {/* Left — Branding */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary-700 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">RoomSync</p>
            <p className="section-label text-surface-400">Room Schedule — Live Display</p>
          </div>
        </div>

        {/* Center — Date */}
        <p className="hidden md:block text-sm text-surface-400">{dateStr}</p>

        {/* Right — Clock + Status */}
        <div className="text-right">
          <p className="text-4xl lg:text-5xl xl:text-6xl font-mono font-bold text-white tabular-nums leading-none tracking-tight">
            {clockStr}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1.5">
            {socket?.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">LIVE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-danger-500" />
                <WifiOff className="w-3.5 h-3.5 text-danger-400" />
                <span className="text-xs text-danger-400 font-medium">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══════════ Main Grid ══════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">

        {/* ── Left 2/3 — Events ── */}
        <div className="lg:col-span-2 flex flex-col gap-0 border-r border-surface-700 overflow-y-auto">

          {/* HAPPENING NOW */}
          <section className="p-6 lg:p-8 border-b border-surface-700">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="section-label text-surface-300">Happening Now</h2>
              <span className="ml-auto text-xs text-surface-500 tabular-nums">
                {ongoingEvents.length} active
              </span>
            </div>

            {ongoingEvents.length === 0 ? (
              <div className="rounded-md bg-surface-800 border border-surface-700 p-10 text-center">
                <p className="text-lg text-surface-500">No events in progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ongoingEvents.map((event: any) => {
                  const start    = new Date(`${event.date}T${event.startTime}:00`);
                  const end      = new Date(`${event.date}T${event.endTime}:00`);
                  const total    = end.getTime() - start.getTime();
                  const elapsed  = currentTime.getTime() - start.getTime();
                  const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);

                  return (
                    <div key={event._id}
                      className="rounded-md bg-surface-800 border border-surface-700 border-l-4 border-l-emerald-500 p-5 lg:p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <h3 className="text-xl lg:text-2xl font-bold text-white leading-snug truncate">
                            {event.title}
                          </h3>
                          <p className="text-base text-surface-300 mt-1">{event.faculty}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-semibold text-emerald-400 tabular-nums">
                            {formatTime(event.startTime)} – {formatTime(event.endTime)}
                          </p>
                          <p className="text-sm text-surface-400 mt-1">
                            {event.roomId?.roomNumber}{event.roomId?.building ? ` · ${event.roomId.building}` : ''}
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                          <span>In Progress</span>
                          <span className="tabular-nums">{Math.round(progress)}% complete</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-700">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* UP NEXT */}
          <section className="p-6 lg:p-8 flex-1">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="section-label text-surface-300">Up Next</h2>
              <span className="ml-auto text-xs text-surface-500 tabular-nums">
                {upcomingEvents.length} scheduled
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="rounded-md bg-surface-800 border border-surface-700 p-8 text-center">
                <p className="text-base text-surface-500">No more events scheduled today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 8).map((event: any, i: number) => (
                  <div key={event._id}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-md border border-surface-700 bg-surface-800',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Time */}
                    <div className="text-center min-w-[72px] shrink-0">
                      <p className="text-sm font-bold text-primary-400 tabular-nums">
                        {formatTime(event.startTime)}
                      </p>
                      <p className="text-xs text-surface-500 tabular-nums">
                        to {formatTime(event.endTime)}
                      </p>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-8 bg-surface-700 shrink-0" />
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5 truncate">
                        {event.faculty} · {event.roomId?.roomNumber || 'N/A'}
                      </p>
                    </div>
                    {/* Type badge */}
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-surface-700 text-surface-300 font-medium">
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Right 1/3 — Room Status ── */}
        <div className="p-6 lg:p-8 overflow-y-auto">
          <h2 className="section-label text-surface-300 mb-5">Room Status</h2>
          <div className="space-y-3">
            {rooms?.map((room: any) => {
              const activeEvent = getRoomStatus(room._id);
              const occupied    = !!activeEvent;
              return (
                <div key={room._id}
                  className={cn(
                    'rounded-md border p-4',
                    occupied
                      ? 'bg-danger-900/20 border-danger-800/40'
                      : 'bg-emerald-900/10 border-emerald-800/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-base font-bold text-white">{room.roomNumber}</p>
                    {occupied
                      ? <XCircle    className="w-4 h-4 text-danger-400 shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    }
                  </div>
                  <p className="text-xs text-surface-500 mb-2">{room.building}</p>

                  {occupied ? (
                    <>
                      <span className="badge bg-danger-900/40 text-danger-300 border-danger-700 text-xs mb-2">
                        Occupied
                      </span>
                      <p className="text-xs text-danger-300 truncate">{activeEvent.title}</p>
                      <p className="text-xs text-surface-500 mt-0.5 tabular-nums">
                        until {formatTime(activeEvent.endTime)}
                      </p>
                    </>
                  ) : (
                    <span className="badge bg-emerald-900/30 text-emerald-300 border-emerald-700 text-xs">
                      Available
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
