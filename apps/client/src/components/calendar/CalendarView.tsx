import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Clock, MapPin } from 'lucide-react';
import { formatDate, formatTime, getEventTypeColor, cn } from '@/lib/utils';

interface CalendarViewProps {
  schedules: any[];
  rooms: any[];
  onSelectSlot?: (date: string, startTime: string, roomId: string) => void;
  isAdmin?: boolean;
}

const START_HOUR = 8; // 8:00 AM
const END_HOUR = 20; // 8:00 PM
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

// Helper to convert time string (HH:MM) to minutes from START_HOUR
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMin = hours * 60 + minutes;
  const startMin = START_HOUR * 60;
  return Math.max(0, totalMin - startMin);
}

// Generate array of hours for the Y-axis
const hoursArray = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function CalendarView({ schedules, rooms, onSelectSlot, isAdmin = false }: CalendarViewProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Set default room if none selected and rooms load
  React.useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId('all');
    }
  }, [rooms, selectedRoomId]);

  // Get start of current week (Monday) based on currentDate
  const startOfWeek = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [currentDate]);

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [startOfWeek]);

  // Get date strings (YYYY-MM-DD) for the week
  const weekDateStrings = useMemo(() => {
    return weekDays.map(day => {
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    });
  }, [weekDays]);

  // Navigate week
  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  // Filter schedules for the selected room and selected week
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const isInWeek = weekDateStrings.includes(s.date);
      if (selectedRoomId === 'all') {
        return isInWeek;
      }
      const scheduleRoomId = typeof s.roomId === 'object' ? s.roomId._id : s.roomId;
      const isSameRoom = scheduleRoomId === selectedRoomId;
      return isSameRoom && isInWeek;
    });
  }, [schedules, selectedRoomId, weekDateStrings]);

  // Group schedules by date string
  const schedulesByDate = useMemo(() => {
    const groups: { [date: string]: any[] } = {};
    weekDateStrings.forEach(d => {
      groups[d] = [];
    });
    filteredSchedules.forEach(s => {
      if (groups[s.date]) {
        groups[s.date].push(s);
      }
    });
    return groups;
  }, [filteredSchedules, weekDateStrings]);

  // Click on slot callback helper
  const handleSlotClick = (dateStr: string, hour: number) => {
    if (isAdmin && onSelectSlot && selectedRoomId) {
      const timeString = `${String(hour).padStart(2, '0')}:00`;
      onSelectSlot(dateStr, timeString, selectedRoomId === 'all' ? '' : selectedRoomId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls & Room Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-800 p-4 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={setToday}
            className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 font-medium text-sm text-surface-700 dark:text-surface-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="ml-2 font-semibold text-surface-900 dark:text-white text-sm md:text-base">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Room Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-surface-500 shrink-0">Select Room:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-medium text-surface-950 dark:text-white min-w-[150px]"
          >
            <option value="all">All Rooms</option>
            {rooms.map(room => (
              <option key={room._id} value={room._id}>
                {room.roomNumber} ({room.building})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid container */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {/* Calendar Table Layout */}
          <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)] select-none">
            {/* Header Corners & Days */}
            <div className="border-b border-r border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/40 p-4"></div>
            {weekDays.map((day, idx) => {
              const isToday = new Date().toDateString() === day.toDateString();
              return (
                <div
                  key={idx}
                  className={cn(
                    'text-center p-3 border-b border-surface-200 dark:border-surface-700 font-medium bg-surface-50/50 dark:bg-surface-900/40 border-r last:border-r-0 flex flex-col items-center justify-center',
                    isToday && 'bg-primary-500/5 dark:bg-primary-500/10'
                  )}
                >
                  <span className={cn('text-xs uppercase font-semibold tracking-wider text-surface-500', isToday && 'text-primary-500')}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={cn(
                    'mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-surface-900 dark:text-white',
                    isToday && 'bg-primary-500 text-white dark:text-white'
                  )}>
                    {day.getDate()}
                  </span>
                </div>
              );
            })}

            {/* Time Grid Row */}
            <div className="col-span-8 grid grid-cols-[80px_repeat(7,1fr)] relative" style={{ height: '600px' }}>
              {/* Hour slots on Y axis (left labels) */}
              <div className="relative border-r border-surface-200 dark:border-surface-700 h-full bg-surface-50/20 dark:bg-surface-900/10">
                {hoursArray.map((hour, idx) => {
                  const topPercent = (idx / (hoursArray.length - 1)) * 100;
                  const h12 = hour % 12 || 12;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 text-right pr-3 -translate-y-1/2 text-xs font-semibold text-surface-400 font-mono"
                      style={{ top: `${topPercent}%` }}
                    >
                      {h12}:00 {ampm}
                    </div>
                  );
                })}
              </div>

              {/* Grid vertical lines / columns for days */}
              {weekDateStrings.map((dateStr) => {
                const daySchedules = schedulesByDate[dateStr] || [];
                const sortedDaySchedules = [...daySchedules].sort((a, b) => a.startTime.localeCompare(b.startTime));

                // Clustering layout for overlapping events
                const clusters: any[][] = [];
                let currentCluster: any[] = [];
                let clusterEnd = '00:00';

                for (const s of sortedDaySchedules) {
                  if (currentCluster.length === 0) {
                    currentCluster.push(s);
                    clusterEnd = s.endTime;
                  } else if (s.startTime < clusterEnd) {
                    currentCluster.push(s);
                    if (s.endTime > clusterEnd) {
                      clusterEnd = s.endTime;
                    }
                  } else {
                    clusters.push(currentCluster);
                    currentCluster = [s];
                    clusterEnd = s.endTime;
                  }
                }
                if (currentCluster.length > 0) {
                  clusters.push(currentCluster);
                }

                const layoutData = new Map<string, { left: number; width: number }>();
                for (const cluster of clusters) {
                  const clusterCols: any[][] = [];
                  for (const s of cluster) {
                    let placed = false;
                    for (let colIdx = 0; colIdx < clusterCols.length; colIdx++) {
                      const col = clusterCols[colIdx];
                      const lastEvent = col[col.length - 1];
                      if (lastEvent.endTime <= s.startTime) {
                        col.push(s);
                        placed = true;
                        break;
                      }
                    }
                    if (!placed) {
                      clusterCols.push([s]);
                    }
                  }

                  const totalCols = clusterCols.length;
                  const colWidth = 100 / totalCols;
                  clusterCols.forEach((col, colIdx) => {
                    col.forEach((s) => {
                      layoutData.set(s._id.toString(), {
                        left: colIdx * colWidth,
                        width: colWidth,
                      });
                    });
                  });
                }

                return (
                  <div
                    key={dateStr}
                    className="relative h-full border-r last:border-r-0 border-surface-200 dark:border-surface-700 group/col"
                  >
                    {/* Horizontal hour helper lines in each column */}
                    {hoursArray.map((hour, idx) => {
                      const topPercent = (idx / (hoursArray.length - 1)) * 100;
                      return (
                        <div
                          key={hour}
                          onClick={() => handleSlotClick(dateStr, hour)}
                          className={cn(
                            'absolute left-0 right-0 border-t border-surface-100 dark:border-surface-800/80 cursor-pointer hover:bg-primary-500/5 transition-all duration-100',
                            idx === 0 && 'border-t-0',
                            isAdmin ? 'block' : 'pointer-events-none'
                          )}
                          style={{
                            top: `${topPercent}%`,
                            height: `${100 / (hoursArray.length - 1)}%`
                          }}
                          title={isAdmin ? `Click to schedule at ${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}` : undefined}
                        />
                      );
                    })}

                    {/* Absolute positioned schedules in this column */}
                    {sortedDaySchedules.map((s) => {
                      const startMin = timeToMinutes(s.startTime);
                      const endMin = timeToMinutes(s.endTime);
                      const duration = endMin - startMin;

                      // Calculate positioning percent
                      const topPercent = (startMin / TOTAL_MINUTES) * 100;
                      const heightPercent = (duration / TOTAL_MINUTES) * 100;

                      // Skip if out of bounds of display times
                      if (topPercent >= 100 || topPercent + heightPercent <= 0) return null;

                      const layout = layoutData.get(s._id.toString()) || { left: 0, width: 100 };

                      return (
                        <div
                          key={s._id}
                          className={cn(
                            'absolute rounded-xl border p-2 lg:p-2.5 overflow-hidden transition-all duration-200 hover:z-10 shadow-sm flex flex-col group/card cursor-pointer',
                            s.type === 'Lecture' && 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-200 hover:bg-blue-100/80 dark:hover:bg-blue-900/50',
                            s.type === 'Meeting' && 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-200 hover:bg-purple-100/80 dark:hover:bg-purple-900/50',
                            s.type === 'Training' && 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
                            s.type === 'Seminar' && 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50'
                          )}
                          style={{
                            top: `${Math.max(0, topPercent)}%`,
                            height: `${Math.min(100 - topPercent, heightPercent)}%`,
                            left: `calc(${layout.left}% + 3px)`,
                            width: `calc(${layout.width}% - 6px)`,
                          }}
                        >
                          {/* Room label if "all" is selected */}
                          {selectedRoomId === 'all' && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider block opacity-75 truncate mb-0.5 text-primary-750 dark:text-primary-400">
                              📍 {s.roomId?.roomNumber || 'Unknown'}
                            </span>
                          )}

                          {/* Title */}
                          <p className="font-bold text-xs line-clamp-1 leading-tight">{s.title}</p>
                          
                          {/* Summary details - hide if height too small */}
                          {duration >= 65 && (
                            <div className="mt-1 space-y-0.5 text-[10px] opacity-85">
                              <p className="flex items-center gap-1 font-medium truncate">
                                <User className="w-2.5 h-2.5" /> {s.faculty}
                              </p>
                              <p className="flex items-center gap-1 truncate">
                                <Clock className="w-2.5 h-2.5" /> {formatTime(s.startTime)} - {formatTime(s.endTime)}
                              </p>
                            </div>
                          )}

                          {/* Rich Tooltip popup on Hover */}
                          <div className="absolute invisible group-hover/card:visible opacity-0 group-hover/card:opacity-100 transition-all duration-200 z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl text-surface-900 dark:text-white pointer-events-none">
                            <div className="flex items-start justify-between mb-2">
                              <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider', getEventTypeColor(s.type))}>
                                {s.type}
                              </span>
                              <span className="text-[10px] text-surface-400 font-medium font-mono">{formatDate(s.date)}</span>
                            </div>
                            
                            <h4 className="font-bold text-sm text-surface-950 dark:text-white mb-2 leading-snug">{s.title}</h4>
                            
                            <div className="space-y-1.5 text-xs text-surface-600 dark:text-surface-400">
                              <p className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                                <span className="font-medium">{s.faculty}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                                <span>{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                                <span>Room {s.roomId?.roomNumber} ({s.roomId?.building})</span>
                              </p>
                              {s.description && (
                                <p className="mt-2 text-[11px] border-t border-surface-100 dark:border-surface-800 pt-1.5 leading-normal text-surface-500 italic">
                                  "{s.description}"
                                </p>
                              )}
                              
                              {/* Room Coordinator Details (Admin only) */}
                              {isAdmin && s.roomCoordinator && (
                                <div className="mt-3 pt-2.5 border-t border-surface-150 dark:border-surface-800 space-y-1 text-[11px] bg-surface-50 dark:bg-surface-950 p-2 rounded-xl">
                                  <p className="font-semibold text-surface-700 dark:text-surface-300">Room Coordinator:</p>
                                  <p className="truncate">👤 {s.roomCoordinator}</p>
                                  <p className="truncate">📞 {s.coordinatorMobileNumber}</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-surface-900" />
                          </div>
                        </div>
                      );
                    })}
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
