import React from 'react';
import { useSchedules, useTodaySchedules, useRooms } from '@/hooks/useApi';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatTime, getStatusClass, getEventTypeColor, cn } from '@/lib/utils';
import {
  Calendar, Clock, MapPin, User, Loader2, BookOpen, LayoutDashboard,
  DoorOpen, Presentation, GraduationCap, ChevronRight
} from 'lucide-react';

export default function ViewerDashboard() {
  useSocketEvents();
  const { user } = useAuthStore();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: todaySchedulesData, isLoading: todayLoading } = useTodaySchedules();
  const { data: allSchedulesData, isLoading: allLoading } = useSchedules({ limit: 100 });

  const todaySchedules = todaySchedulesData?.data || [];
  const allSchedules = allSchedulesData?.data || [];

  // Filter lectures assigned to me/department
  const myLectures = allSchedules.filter((s: any) => s.type === 'Lecture');
  
  const myOngoingLectures = myLectures.filter((s: any) => s.status === 'ongoing');
  const myUpcomingLectures = myLectures.filter((s: any) => s.status === 'upcoming');

  // Today's schedule assigned to me/department/public
  const todayOngoingEvents = todaySchedules.filter((s: any) => s.status === 'ongoing');

  // Extract unique faculty teaching my lectures
  const facultyList = Array.from(
    new Map(
      allSchedules.map((s: any) => [s.faculty, { name: s.faculty, type: s.type, dept: s.assignedDepartment || 'General' }])
    ).values()
  );

  // Check if room is occupied by any ongoing schedule
  const isRoomOccupied = (roomId: string) => {
    return todayOngoingEvents.some((s: any) => {
      const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
      return rid === roomId;
    });
  };

  const getRoomOccupyingEvent = (roomId: string) => {
    return todayOngoingEvents.find((s: any) => {
      const rid = typeof s.roomId === 'object' ? s.roomId?._id : s.roomId;
      return rid === roomId;
    });
  };

  const isLoading = roomsLoading || todayLoading || allLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Hero ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-surface-900 dark:text-white">Welcome, {user?.name}</h1>
          </div>
          <p className="text-sm text-surface-500">
            Viewer Dashboard · {user?.department} Department
          </p>
        </div>
        <div className="text-xs text-surface-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left/Middle Column (Schedules) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ongoing Lectures */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                My Ongoing Lectures
              </h2>
              {myOngoingLectures.length === 0 ? (
                <div className="card p-6 text-center text-surface-500 text-xs">
                  No lectures ongoing at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOngoingLectures.map((lecture: any) => (
                    <div key={lecture._id} className="card border-l-4 border-emerald-500 p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 rounded-bl">
                        Live Now
                      </div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white pr-14 leading-snug">
                        {lecture.title}
                      </h3>
                      <div className="space-y-1.5 text-xs text-surface-600 dark:text-surface-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-surface-400" />
                          <span>{lecture.faculty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-surface-400" />
                          <span>{lecture.roomId?.roomNumber || 'N/A'} — {lecture.roomId?.building || 'Main'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-surface-400" />
                          <span>{formatTime(lecture.startTime)} – {formatTime(lecture.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Lectures */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-700" />
                My Upcoming Lectures
              </h2>
              {myUpcomingLectures.length === 0 ? (
                <div className="card p-6 text-center text-surface-500 text-xs">
                  No upcoming lectures scheduled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myUpcomingLectures.slice(0, 4).map((lecture: any) => (
                    <div key={lecture._id} className="card border-l-4 border-primary-600 p-4 space-y-3">
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-snug">
                        {lecture.title}
                      </h3>
                      <div className="space-y-1.5 text-xs text-surface-600 dark:text-surface-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-surface-400" />
                          <span>{lecture.faculty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-surface-400" />
                          <span>{lecture.roomId?.roomNumber || 'N/A'} — {lecture.roomId?.building || 'Main'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-surface-400" />
                          <span>{formatDate(lecture.date)} ({formatTime(lecture.startTime)} – {formatTime(lecture.endTime)})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Schedule List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-700" />
                Today's Schedule (Assigned &amp; General)
              </h2>
              {todaySchedules.length === 0 ? (
                <div className="card p-8 text-center text-surface-500 text-xs">
                  No classes or sessions scheduled for today.
                </div>
              ) : (
                <div className="card divide-y divide-surface-100 dark:divide-surface-700">
                  {todaySchedules.map((event: any) => (
                    <div key={event._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider', getEventTypeColor(event.type))}>
                            {event.type}
                          </span>
                          <span className={cn('badge text-[10px] py-0', getStatusClass(event.status))}>
                            {event.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-surface-400" />
                            {event.faculty}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-surface-400" />
                            Room {event.roomId?.roomNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-surface-700 dark:text-surface-300 shrink-0">
                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column (Rooms & Faculty Directory) ── */}
          <div className="space-y-6">
            {/* Rooms List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-primary-700" />
                Room Information
              </h2>
              <div className="card max-h-[360px] overflow-y-auto divide-y divide-surface-100 dark:divide-surface-700">
                {rooms?.map((room: any) => {
                  const occupied = isRoomOccupied(room._id);
                  const ongoingEvent = getRoomOccupyingEvent(room._id);
                  return (
                    <div key={room._id} className="p-3.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white">Room {room.roomNumber}</p>
                        <p className="text-xs text-surface-500">{room.building} · {room.capacity} seats</p>
                        {occupied && ongoingEvent && (
                          <p className="text-[10px] text-danger-600 dark:text-danger-400 mt-1 truncate">
                            Occupied: {ongoingEvent.title}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0',
                        occupied
                          ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      )}>
                        {occupied ? 'In Use' : 'Free'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Faculty Directory */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary-700" />
                Faculty Directory
              </h2>
              <div className="card max-h-[280px] overflow-y-auto divide-y divide-surface-100 dark:divide-surface-700">
                {facultyList.length === 0 ? (
                  <div className="p-4 text-center text-surface-500 text-xs">
                    No faculty assigned to your schedules.
                  </div>
                ) : (
                  facultyList.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs">
                        {f.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-surface-900 dark:text-white truncate">{f.name}</p>
                        <p className="text-[10px] text-surface-500">{f.dept}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
