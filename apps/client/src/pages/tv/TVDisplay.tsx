import { useState, useEffect, useRef, useCallback } from 'react';
import { useTodaySchedules, useRooms, useActiveDisplayMedia, useActiveAnnouncements } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { cn } from '@/lib/utils';
import {
  Wifi, WifiOff, Clock, MapPin, User, DoorOpen,
  CheckCircle2, XCircle, Monitor, Loader2, Megaphone,
} from 'lucide-react';

export default function TVDisplay() {
  useSocketEvents();
  const { data: todayData } = useTodaySchedules();
  const { data: rooms } = useRooms();
  const { data: displayMedia, isLoading: isLoadingMedia } = useActiveDisplayMedia();
  const { data: announcements } = useActiveAnnouncements();

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slideshow
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = displayMedia || [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000); // Rotate every 8 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  // Cursor auto-hide
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const handleMove = () => {
      setCursorVisible(true);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => setCursorVisible(false), 3000);
    };
    window.addEventListener('mousemove', handleMove);
    cursorTimer.current = setTimeout(() => setCursorVisible(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
    };
  }, []);

  // Connection status
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data parsing & sorting
  const todaySchedules = todayData?.data || [];
  const ongoingSchedules = todaySchedules.filter((s: any) => s.status === 'ongoing');
  const upcomingSchedules = todaySchedules.filter((s: any) => s.status === 'upcoming');
  const ongoingRoomIds = new Set(
    ongoingSchedules.map((s: any) => typeof s.roomId === 'object' ? s.roomId?._id : s.roomId)
  );

  // Combine and sort schedules:
  // 1. Ongoing schedules first, sorted by soonest ending first
  // 2. Upcoming schedules next, sorted by soonest starting first
  const activeSchedules = [...ongoingSchedules, ...upcomingSchedules].sort((a: any, b: any) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
    if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;

    if (a.status === 'ongoing' && b.status === 'ongoing') {
      return a.endTime.localeCompare(b.endTime);
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Schedule automatic rotation paging (max 5 items per view)
  const itemsPerPage = 5;
  const totalPages = Math.ceil(activeSchedules.length / itemsPerPage);
  const [schedulePageIndex, setSchedulePageIndex] = useState(0);

  useEffect(() => {
    if (totalPages <= 1) {
      setSchedulePageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setSchedulePageIndex((prev) => (prev + 1) % totalPages);
    }, 6000); // Page through schedules every 6 seconds if overflow
    return () => clearInterval(interval);
  }, [totalPages]);

  const visibleSchedules = activeSchedules.slice(
    schedulePageIndex * itemsPerPage,
    (schedulePageIndex + 1) * itemsPerPage
  );

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getProgress = (start: string, end: string) => {
    const today = now.toISOString().split('T')[0];
    const startMs = new Date(`${today}T${start}`).getTime();
    const endMs = new Date(`${today}T${end}`).getTime();
    const total = endMs - startMs;
    const elapsed = now.getTime() - startMs;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const BASE_URL = API_URL.replace('/api', '');

  return (
    <div className={cn('min-h-screen bg-surface-950 text-white tv-mode overflow-hidden', cursorVisible && 'cursor-visible')}>
      <div className="h-screen flex flex-col lg:flex-row p-4 lg:p-5 gap-4 lg:gap-5">
        
        {/* ═══════════ LEFT PANEL (60%): Slideshow & Text Announcements ═══════════ */}
        <div className="flex-1 lg:w-3/5 flex flex-col h-full min-w-0 gap-4 lg:gap-5">
          {/* Top Section: Slideshow Signage (70% height) */}
          <div className="h-[70%] relative rounded-2xl overflow-hidden bg-surface-900 border border-surface-800/80 shadow-2xl">
            {isLoadingMedia ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-950/60 animate-pulse">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                <p className="text-sm text-surface-400">Loading signage media...</p>
              </div>
            ) : slides.length > 0 ? (
              <>
                {slides.map((slide: any, i: number) => (
                  <div
                    key={slide._id || i}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center bg-surface-950',
                      i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    )}
                  >
                    {/* Ambient Blurred Background */}
                    <img
                      src={`${BASE_URL}${slide.imageUrl}`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-45 scale-105 select-none pointer-events-none"
                    />

                    {/* Main Contained Image */}
                    <img
                      src={`${BASE_URL}${slide.imageUrl}`}
                      alt={slide.title || 'Digital Signage'}
                      className="relative z-10 max-w-full max-h-full object-contain select-none shadow-2xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '';
                        target.classList.add('hidden');
                      }}
                    />

                    {/* Dark Overlay (25%) */}
                    <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none" />

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 z-30">
                      <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">
                        {slide.title}
                      </h2>
                    </div>
                  </div>
                ))}

                {/* Slideshow Dot Indicators */}
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                    {slides.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all duration-300',
                          i === currentSlide ? 'bg-white scale-125' : 'bg-white/30'
                        )}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* RoomSync default banner */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-950 via-surface-950 to-primary-950 border border-primary-900/30">
                <div className="text-center relative px-6 py-12 max-w-md">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-900/40 border border-primary-500/20">
                    <DoorOpen className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-3 bg-gradient-to-r from-white via-surface-100 to-primary-300 bg-clip-text text-transparent">
                    RoomSync
                  </h1>
                  <div className="h-0.5 w-16 bg-primary-500 mx-auto mb-4 rounded-full" />
                  <p className="text-sm font-semibold text-primary-400/90 uppercase tracking-widest mb-1">Welcome</p>
                  <p className="text-xs text-surface-400/80 tracking-wide">
                    Real-Time Scheduling System
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Announcements Board (30% height) */}
          <div className="h-[30%] bg-surface-900/50 border border-surface-800/80 rounded-2xl p-5 flex flex-col min-h-0 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0 border-b border-surface-800/50 pb-2">
              <Megaphone className="w-4 h-4 text-primary-500" />
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-surface-400">
                Announcements board
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {!announcements?.length ? (
                <div className="h-full flex items-center justify-center text-xs text-surface-500 italic">
                  No active announcements today.
                </div>
              ) : (
                announcements.map((ann: any) => (
                  <div
                    key={ann._id}
                    className={cn(
                      'p-4 rounded-xl border flex items-start gap-3 animate-fade-in text-sm md:text-base leading-snug',
                      ann.priority === 'Important'
                        ? 'bg-danger-950/20 border-danger-900/40 text-danger-200'
                        : 'bg-surface-900/40 border-surface-850 text-surface-200'
                    )}
                  >
                    {ann.priority === 'Important' && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-danger-600 text-white animate-pulse">
                        IMPORTANT
                      </span>
                    )}
                    <span className="font-semibold">{ann.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL (40%): Information Area ═══════════ */}
        <div className="lg:w-2/5 flex flex-col gap-4 lg:gap-5 min-w-0 h-full">
          
          {/* Top: Clock & Date */}
          <div className="shrink-0 text-right bg-surface-900/40 border border-surface-800/40 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between">
              {/* RoomSync branding */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-700 flex items-center justify-center shadow-md">
                  <DoorOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold tracking-wider text-surface-300 uppercase">RoomSync</span>
              </div>
              {/* Connection status */}
              <div className="flex items-center gap-1.5">
                <span className={cn('relative flex h-2 w-2')}>
                  <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', isConnected ? 'bg-success-400' : 'bg-danger-400')} />
                  <span className={cn('relative inline-flex h-2 w-2 rounded-full', isConnected ? 'bg-success-500' : 'bg-danger-500')} />
                </span>
                <span className={cn('text-[10px] font-bold tracking-widest uppercase', isConnected ? 'text-success-400' : 'text-danger-400')}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <p className="text-5xl lg:text-[3.25rem] font-black text-white tabular-nums mt-2 tracking-tighter" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              {timeStr}
            </p>
            <p className="text-xs font-medium text-surface-400 mt-1 uppercase tracking-wider">{dateStr}</p>
          </div>

          {/* Middle: Happening Now (Active Classes) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
              </span>
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-surface-400">
                Happening Now
              </h2>
              {activeSchedules.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success-950 text-success-400 border border-success-900/50 ml-auto">
                  {ongoingSchedules.length} ongoing
                </span>
              )}
            </div>

            {activeSchedules.length > 0 ? (
              <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1">
                {visibleSchedules.map((schedule: any) => {
                  const room = typeof schedule.roomId === 'object' ? schedule.roomId : null;
                  const isOngoing = schedule.status === 'ongoing';
                  const progress = isOngoing ? getProgress(schedule.startTime, schedule.endTime) : 0;
                  
                  return (
                    <div
                      key={schedule._id}
                      className={cn(
                        'bg-surface-900/60 border border-surface-800/80 rounded-xl p-3 border-l-4 flex flex-col justify-between shrink-0',
                        isOngoing ? 'border-l-success-500' : 'border-l-primary-500'
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-1" title={schedule.title}>
                          {schedule.title}
                        </h3>
                        {room && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-800 text-surface-200 border border-surface-700/50 shrink-0">
                            {room.roomNumber}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 my-2 text-[11px] text-surface-400 font-medium">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                          <span className="truncate">{schedule.faculty}</span>
                        </div>
                        <div className={cn('flex items-center gap-1.5 justify-end tabular-nums', isOngoing ? 'text-success-400' : 'text-primary-400')}>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}</span>
                        </div>
                      </div>

                      {/* Progress Bar (Visible for ongoing, placeholder/empty space avoided for upcoming) */}
                      <div className="w-full mt-0.5">
                        <div className="flex justify-between text-[9px] text-surface-400 mb-0.5">
                          <span>{isOngoing ? 'Progress' : 'Starts soon'}</span>
                          <span className="tabular-nums">{isOngoing ? `${Math.round(progress)}%` : '0%'}</span>
                        </div>
                        <div className="w-full h-1 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-1000 ease-linear', isOngoing ? 'bg-success-500' : 'bg-primary-500')}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Paging / Rotation indicator */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full transition-all duration-300',
                          idx === schedulePageIndex ? 'bg-primary-500 scale-125' : 'bg-surface-700'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-surface-900/20 border border-dashed border-surface-800/60 rounded-xl p-4">
                <div className="text-center">
                  <Monitor className="w-8 h-8 text-surface-700 mx-auto mb-2" />
                  <p className="text-sm font-bold text-surface-500">No events in progress</p>
                  <p className="text-xs text-surface-600 mt-0.5">Classes will show up here when active</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom: Room Status */}
          <div className="shrink-0 bg-surface-900/20 border border-surface-800/40 rounded-xl p-4">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-surface-400 mb-2 px-0.5">
              Room Status
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(rooms || []).slice(0, 8).map((room: any) => {
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
                    className={cn(
                      'px-2.5 py-2 rounded-lg border transition-all duration-200 flex flex-col justify-between h-[52px]',
                      occupied
                        ? 'bg-danger-950/20 border-danger-900/50'
                        : 'bg-surface-900/40 border-surface-800/60'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{room.roomNumber}</span>
                      <span className="flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full', occupied ? 'bg-danger-500' : 'bg-success-500')} />
                        <span className={cn('text-[9px] font-bold', occupied ? 'text-danger-400' : 'text-success-400')}>
                          {occupied ? 'BUSY' : 'FREE'}
                        </span>
                      </span>
                    </div>
                    {occupied && activeEvent ? (
                      <p className="text-[9px] text-danger-400/90 truncate leading-none mt-1">
                        {activeEvent.title}
                      </p>
                    ) : (
                      <p className="text-[9px] text-surface-500 truncate leading-none mt-1">
                        {room.building}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
