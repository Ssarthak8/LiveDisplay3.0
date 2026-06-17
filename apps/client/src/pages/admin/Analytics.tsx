import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  Clock,
  BookOpen,
  DoorOpen,
  BarChart3,
  PieChart as PieIcon,
  ChevronLeft,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface RoomStat {
  roomId: string;
  roomNumber: string;
  building: string;
  totalBookings: number;
  totalHoursUsed: number;
  utilizationPercentage: number;
}

interface Summary {
  totalBookings: number;
  totalHoursUsed: number;
  mostUsedRoom: {
    roomNumber: string;
    building: string;
    hoursUsed: number;
  } | null;
  leastUsedRoom: {
    roomNumber: string;
    building: string;
    hoursUsed: number;
  } | null;
}

interface AnalyticsData {
  success: boolean;
  summary: Summary;
  roomStats: RoomStat[];
}

const COLORS = [
  'hsl(217, 91%, 60%)', // primary blue
  'hsl(142, 71%, 45%)', // success emerald
  'hsl(38, 92%, 50%)',  // warning amber
  'hsl(262, 83%, 58%)', // purple
  'hsl(316, 70%, 50%)', // pink
  'hsl(180, 70%, 40%)', // teal
  'hsl(17, 85%, 52%)',  // orange
  'hsl(199, 89%, 48%)', // cyan
];

// SVG Arc drawing helpers
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

export default function Analytics() {
  const [rangeType, setRangeType] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Helper: Get range dates
  const calculateDates = (type: 'week' | 'month' | 'custom') => {
    const today = new Date();
    if (type === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const mon = new Date(today.setDate(diff));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return {
        start: mon.toISOString().split('T')[0],
        end: sun.toISOString().split('T')[0]
      };
    } else if (type === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
    return { start: startDate, end: endDate };
  };

  const activeLabel = (() => {
    if (rangeType === 'week') return 'This Week';
    if (rangeType === 'month') return 'This Month';
    return `${startDate} to ${endDate}`;
  })();

  // Sync date ranges on type change
  useEffect(() => {
    if (rangeType !== 'custom') {
      const { start, end } = calculateDates(rangeType);
      setStartDate(start);
      setEndDate(end);
    }
  }, [rangeType]);

  // Fetch data
  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const response = await api.get<AnalyticsData>('/analytics', {
        params: { startDate, endDate }
      });
      setData(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Excel Export
  const handleExport = async () => {
    if (!startDate || !endDate) return;
    setIsExporting(true);
    try {
      const response = await api.get('/analytics/export', {
        params: { startDate, endDate, rangeLabel: activeLabel },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `room_utilization_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report exported successfully');
    } catch (err: any) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Compute values for Pie Chart
  const totalHoursAllRooms = data?.roomStats.reduce((sum, r) => sum + r.totalHoursUsed, 0) || 0;
  
  let currentAngle = 0;
  const pieSlices = (data?.roomStats || [])
    .filter(r => r.totalHoursUsed > 0)
    .map((item, idx) => {
      const percentShare = totalHoursAllRooms > 0 ? (item.totalHoursUsed / totalHoursAllRooms) * 100 : 0;
      const sliceAngle = (item.totalHoursUsed / totalHoursAllRooms) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      const color = COLORS[idx % COLORS.length];
      
      return {
        roomNumber: item.roomNumber,
        hoursUsed: item.totalHoursUsed,
        share: Math.round(percentShare),
        color,
        path: percentShare >= 99.9 ? '' : describeArc(100, 100, 80, startAngle, endAngle)
      };
    });

  const maxHoursUsed = Math.max(...(data?.roomStats.map(r => r.totalHoursUsed) || [10]), 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            Room Utilization Analytics
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Monitor room bookings, usage hours, and export utilization reports.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-surface-300 dark:border-surface-600 rounded-md overflow-hidden text-xs font-medium">
            <button
              onClick={() => setRangeType('week')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                rangeType === 'week'
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-750'
              )}
            >
              This Week
            </button>
            <button
              onClick={() => setRangeType('month')}
              className={cn(
                'px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
                rangeType === 'month'
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-750'
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setRangeType('custom')}
              className={cn(
                'px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
                rangeType === 'custom'
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-500 hover:text-surface-750'
              )}
            >
              Custom Range
            </button>
          </div>

          {rangeType === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-surface-800 p-1 border border-surface-200 dark:border-surface-700 rounded-md">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input text-xs border-0 py-1"
              />
              <span className="text-xs text-surface-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input text-xs border-0 py-1"
              />
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="btn-primary py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-750" />
          <p className="text-sm text-surface-500">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card kpi-card-blue">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.mostUsedRoom
                      ? `${data.summary.mostUsedRoom.roomNumber}`
                      : '—'}
                  </div>
                  <div className="kpi-label">Most Used Room</div>
                  {data?.summary.mostUsedRoom && (
                    <p className="text-xs text-surface-400 mt-1">
                      {data.summary.mostUsedRoom.building} ({data.summary.mostUsedRoom.hoursUsed} hrs)
                    </p>
                  )}
                </div>
                <div className="kpi-icon kpi-icon-blue">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="kpi-card kpi-card-amber">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.leastUsedRoom
                      ? `${data.summary.leastUsedRoom.roomNumber}`
                      : '—'}
                  </div>
                  <div className="kpi-label">Least Used Room</div>
                  {data?.summary.leastUsedRoom && (
                    <p className="text-xs text-surface-400 mt-1">
                      {data.summary.leastUsedRoom.building} ({data.summary.leastUsedRoom.hoursUsed} hrs)
                    </p>
                  )}
                </div>
                <div className="kpi-icon kpi-icon-amber">
                  <DoorOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="kpi-card kpi-card-emerald">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.totalHoursUsed ? `${data.summary.totalHoursUsed} hrs` : '0 hrs'}
                  </div>
                  <div className="kpi-label">Total Hours Used</div>
                </div>
                <div className="kpi-icon kpi-icon-emerald">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="kpi-card kpi-card-blue">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.totalBookings || 0}
                  </div>
                  <div className="kpi-label">Total Bookings</div>
                </div>
                <div className="kpi-icon kpi-icon-blue">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pie Chart Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-surface-400" />
                  Room Utilization Percentage
                </h2>
                <span className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider">
                  Total share
                </span>
              </div>

              {totalHoursAllRooms === 0 ? (
                <div className="py-12 text-center">
                  <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto text-surface-200 dark:text-surface-700">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="8" />
                    <text x="100" y="105" textAnchor="middle" className="text-xs font-semibold fill-surface-400 dark:fill-surface-500">
                      No Booked Hours
                    </text>
                  </svg>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Pie Rendering */}
                  <div className="relative w-48 h-48">
                    <svg width="192" height="192" viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {pieSlices.length === 1 && pieSlices[0].share >= 99.9 ? (
                        <circle cx="100" cy="100" r="80" fill={pieSlices[0].color} />
                      ) : (
                        pieSlices.map((slice, i) => (
                          <path
                            key={i}
                            d={slice.path}
                            fill={slice.color}
                            className="hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <title>{slice.roomNumber}: {slice.share}%</title>
                          </path>
                        ))
                      )}
                    </svg>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1.5 flex-1 max-w-[200px]">
                    {pieSlices.map((slice, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="font-medium text-surface-700 dark:text-surface-300">
                            {slice.roomNumber}
                          </span>
                        </div>
                        <span className="font-semibold text-surface-900 dark:text-white">
                          {slice.share}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-surface-400" />
                  Room Hours Used
                </h2>
                <span className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider">
                  Total hours
                </span>
              </div>

              {totalHoursAllRooms === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-b border-l border-surface-200 dark:border-surface-700 pb-2 pl-2">
                  <p className="text-xs text-surface-400 font-medium">No usage hours in range</p>
                </div>
              ) : (
                <div className="h-64 flex items-end gap-3 lg:gap-4 border-b border-l border-surface-200 dark:border-surface-700 pb-2 pl-2">
                  {(data?.roomStats || []).map((item) => {
                    const heightPercent = maxHoursUsed > 0 ? (item.totalHoursUsed / maxHoursUsed) * 100 : 0;
                    return (
                      <div
                        key={item.roomId}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hours tag on hover */}
                        <div className="absolute bottom-full mb-1 bg-surface-900 dark:bg-surface-950 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {item.totalHoursUsed} hrs
                        </div>
                        
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-primary-700 dark:bg-primary-550 rounded-t hover:bg-primary-600 dark:hover:bg-primary-450 transition-all duration-300 cursor-pointer min-h-[4px]"
                        />

                        {/* Top Label when height permits */}
                        {item.totalHoursUsed > 0 && (
                          <span className="absolute bottom-full mb-1 text-[9px] font-bold text-primary-700 dark:text-primary-400 pointer-events-none group-hover:opacity-0 transition-opacity">
                            {item.totalHoursUsed}
                          </span>
                        )}

                        {/* Bottom label (Room Number) */}
                        <span className="text-[10px] font-semibold text-surface-500 mt-2 truncate max-w-full text-center">
                          {item.roomNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-25 dark:bg-surface-850/50">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                Room Utilization Data Table
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Room Number</th>
                    <th>Building</th>
                    <th>Total Bookings</th>
                    <th>Total Hours Used</th>
                    <th>Utilization Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.roomStats || []).map((item) => (
                    <tr key={item.roomId}>
                      <td className="font-semibold text-surface-900 dark:text-white">
                        {item.roomNumber}
                      </td>
                      <td>{item.building}</td>
                      <td className="tabular-nums">{item.totalBookings}</td>
                      <td className="tabular-nums">{item.totalHoursUsed} hrs</td>
                      <td className="font-medium tabular-nums">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-right">{item.utilizationPercentage}%</span>
                          <div className="w-24 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden shrink-0">
                            <div
                              style={{ width: `${item.utilizationPercentage}%` }}
                              className="h-full bg-primary-750 dark:bg-primary-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
