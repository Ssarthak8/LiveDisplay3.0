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
  Users,
  Percent,
  Upload,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomStat {
  roomId: string;
  roomNumber: string;
  building: string;
  capacity: number;
  totalBookings: number;
  totalHoursUsed: number;
  totalParticipants: number;
  occupancyPercentage: number | null; // null for capacity = 0
  utilizationPercentage: number;
}

interface Summary {
  totalBookings: number;
  totalHoursUsed: number;
  totalParticipants: number;
  mostUsedRoom: {
    roomNumber: string;
    building: string;
    hoursUsed: number;
  } | null;
  highestOccupancyRoom: {
    roomNumber: string;
    building: string;
    occupancyPercentage: number;
  } | null;
  averageOccupancyPercentage: number;
  topRooms?: {
    roomNumber: string;
    building: string;
    hoursUsed: number;
  }[];
  topCoordinators?: {
    name: string;
    bookings: number;
  }[];
}

interface AnalyticsData {
  success: boolean;
  summary: Summary;
  roomStats: RoomStat[];
}

interface UploadBatch {
  importBatchId: string;
  sourceFileName: string;
  uploadedAt: string;
  uploadedBy: string;
  recordCount: number;
}

interface UploadResult {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  failedDetails: { row: number; error: string }[];
  importBatchId: string | null;
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
  const [rangeType, setRangeType] = useState<'week' | 'month' | 'lastMonth' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomCoordinator, setRoomCoordinator] = useState('All');
  const [room, setRoom] = useState('All');
  const [purpose, setPurpose] = useState('All');

  const [coordinatorsList, setCoordinatorsList] = useState<string[]>([]);
  const [purposesList, setPurposesList] = useState<string[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Batches state
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(false);

  // Helper: Get range dates
  const calculateDates = (type: 'week' | 'month' | 'lastMonth' | 'custom') => {
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
    } else if (type === 'lastMonth') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
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
    if (rangeType === 'lastMonth') return 'Last Month';
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

  // Fetch rooms list once
  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      if (response.data?.success) {
        setRoomsList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms list', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch data
  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const response = await api.get<AnalyticsData & { coordinators: string[]; purposes: string[] }>('/analytics', {
        params: {
          startDate,
          endDate,
          roomCoordinator: roomCoordinator === 'All' ? undefined : roomCoordinator,
          room: room === 'All' ? undefined : room,
          purpose: purpose === 'All' ? undefined : purpose,
        }
      });
      setData(response.data);
      if (response.data.coordinators) {
        setCoordinatorsList(response.data.coordinators);
      }
      if (response.data.purposes) {
        setPurposesList(response.data.purposes);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch upload batches
  const fetchBatches = async () => {
    setIsBatchesLoading(true);
    try {
      const response = await api.get<{ success: boolean; batches: UploadBatch[] }>('/analytics/batches');
      setBatches(response.data.batches);
    } catch (err: any) {
      console.error('Failed to fetch upload batches', err);
    } finally {
      setIsBatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, roomCoordinator, room, purpose]);

  useEffect(() => {
    fetchBatches();
  }, []);

  // Excel Export
  const handleExport = async () => {
    if (!startDate || !endDate) return;
    setIsExporting(true);
    try {
      const response = await api.get('/analytics/export', {
        params: {
          startDate,
          endDate,
          roomCoordinator: roomCoordinator === 'All' ? undefined : roomCoordinator,
          room: room === 'All' ? undefined : room,
          purpose: purpose === 'All' ? undefined : purpose,
        },
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

  // Excel Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post<UploadResult>('/analytics/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(response.data);
      toast.success(`Uploaded successfully! Imported ${response.data.importedRows} rows.`);
      fetchData();
      fetchBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload Excel data');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Batch
  const handleDeleteBatch = async (batch: UploadBatch) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the dataset "${batch.sourceFileName}"? This will permanently delete all ${batch.recordCount} booking records in this batch from analytics.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/analytics/upload/${batch.importBatchId}`);
      toast.success('Dataset deleted successfully');
      fetchData();
      fetchBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete dataset');
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

  const formatBatchDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Main Actions */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-700 dark:text-primary-400" />
          Room Utilization Analytics
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Monitor room bookings, usage hours, export reports, and upload historical records.
        </p>
        {/* Note Info */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-750 dark:text-blue-400 text-xs border border-blue-100 dark:border-blue-900/50">
          <Info className="w-3.5 h-3.5" />
          <span>Analytics includes uploaded data and current booking data.</span>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col gap-4">
          {/* Top row: Date Range Presets & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date range presets */}
              <div className="flex border border-surface-300 dark:border-surface-600 rounded-md overflow-hidden text-xs font-medium bg-white dark:bg-surface-850 shadow-sm">
                <button
                  onClick={() => setRangeType('week')}
                  className={cn(
                    'px-3 py-1.5 transition-colors',
                    rangeType === 'week'
                      ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                      : 'text-surface-500 hover:text-surface-750 hover:bg-surface-25 dark:hover:bg-surface-800'
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
                      : 'text-surface-500 hover:text-surface-750 hover:bg-surface-25 dark:hover:bg-surface-800'
                  )}
                >
                  This Month
                </button>
                <button
                  onClick={() => setRangeType('lastMonth')}
                  className={cn(
                    'px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
                    rangeType === 'lastMonth'
                      ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                      : 'text-surface-500 hover:text-surface-750 hover:bg-surface-25 dark:hover:bg-surface-800'
                  )}
                >
                  Last Month
                </button>
                <button
                  onClick={() => setRangeType('custom')}
                  className={cn(
                    'px-3 py-1.5 border-l border-surface-300 dark:border-surface-600 transition-colors',
                    rangeType === 'custom'
                      ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white'
                      : 'text-surface-500 hover:text-surface-750 hover:bg-surface-25 dark:hover:bg-surface-800'
                  )}
                >
                  Custom Date Range
                </button>
              </div>

              {/* Custom date range input */}
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
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-secondary py-1.5 text-xs inline-flex items-center gap-1.5 bg-white dark:bg-surface-800 border-surface-300"
              >
                <Upload className="w-3.5 h-3.5 text-surface-500" />
                Upload Data
              </button>
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
                Export Report
              </button>
            </div>
          </div>

          {/* Bottom row: Dropdown filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                Room Coordinator
              </label>
              <select
                value={roomCoordinator}
                onChange={(e) => setRoomCoordinator(e.target.value)}
                className="form-input text-xs"
              >
                <option value="All">All Coordinators</option>
                {coordinatorsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                Room
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="form-input text-xs"
              >
                <option value="All">All Rooms</option>
                {roomsList.map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    {r.roomNumber} ({r.building})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="form-input text-xs"
              >
                <option value="All">All Purposes</option>
                {purposesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-fade-in">
            {/* 1. Total Bookings */}
            <div className="kpi-card kpi-card-blue">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">{data?.summary.totalBookings || 0}</div>
                  <div className="kpi-label">Total Bookings</div>
                </div>
                <div className="kpi-icon kpi-icon-blue">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. Total Hours Used */}
            <div className="kpi-card kpi-card-emerald">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.totalHoursUsed ? `${data.summary.totalHoursUsed} hrs` : '0 hrs'}
                  </div>
                  <div className="kpi-label">Total Hours Used</div>
                </div>
                <div className="kpi-icon kpi-icon-emerald">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. Total Participants */}
            <div className="kpi-card kpi-card-indigo" style={{ borderLeftColor: 'var(--color-primary-600)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">{data?.summary.totalParticipants || 0}</div>
                  <div className="kpi-label">Total Participants</div>
                </div>
                <div className="kpi-icon text-primary-750 bg-primary-50 dark:bg-primary-950/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 4. Most Used Room */}
            <div className="kpi-card kpi-card-amber">
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value truncate max-w-[130px]">
                    {data?.summary.mostUsedRoom ? data.summary.mostUsedRoom.roomNumber : '—'}
                  </div>
                  <div className="kpi-label">Most Used Room</div>
                  {data?.summary.mostUsedRoom && (
                    <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[140px]">
                      {data.summary.mostUsedRoom.building} ({data.summary.mostUsedRoom.hoursUsed} hrs)
                    </p>
                  )}
                </div>
                <div className="kpi-icon kpi-icon-amber">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 5. Highest Occupancy Room */}
            <div className="kpi-card kpi-card-purple" style={{ borderLeftColor: '#8b5cf6' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value truncate max-w-[130px]">
                    {data?.summary.highestOccupancyRoom ? data.summary.highestOccupancyRoom.roomNumber : '—'}
                  </div>
                  <div className="kpi-label">Highest Occupancy Room</div>
                  {data?.summary.highestOccupancyRoom && (
                    <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[140px]">
                      {data.summary.highestOccupancyRoom.building} ({data.summary.highestOccupancyRoom.occupancyPercentage}%)
                    </p>
                  )}
                </div>
                <div className="kpi-icon text-purple-700 bg-purple-50 dark:bg-purple-950/20">
                  <DoorOpen className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 6. Average Occupancy % */}
            <div className="kpi-card kpi-card-red" style={{ borderLeftColor: '#f43f5e' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="kpi-value">
                    {data?.summary.averageOccupancyPercentage ? `${data.summary.averageOccupancyPercentage}%` : '0%'}
                  </div>
                  <div className="kpi-label">Average Occupancy %</div>
                </div>
                <div className="kpi-icon text-red-600 bg-red-50 dark:bg-red-950/20">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
            {/* Top 5 Rooms Card */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-surface-450" />
                Top 5 Most Used Rooms
              </h2>
              {!data?.summary.topRooms?.length ? (
                <p className="text-xs text-surface-400 py-6 text-center">No room usage data available</p>
              ) : (
                <div className="space-y-3">
                  {data.summary.topRooms.map((roomItem: any, idx: number) => (
                    <div key={roomItem.roomNumber} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-750 dark:text-primary-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-surface-800 dark:text-surface-200">
                          {roomItem.roomNumber}
                        </span>
                        <span className="text-[10px] text-surface-400">
                          ({roomItem.building})
                        </span>
                      </div>
                      <span className="font-bold text-surface-900 dark:text-white">
                        {roomItem.hoursUsed} hours
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 Coordinators Card */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-surface-450" />
                Top 5 Room Coordinators
              </h2>
              {!data?.summary.topCoordinators?.length ? (
                <p className="text-xs text-surface-400 py-6 text-center">No coordinator booking data available</p>
              ) : (
                <div className="space-y-3">
                  {data.summary.topCoordinators.map((coordinator: any, idx: number) => (
                    <div key={coordinator.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-surface-800 dark:text-surface-200">
                          {coordinator.name}
                        </span>
                      </div>
                      <span className="font-bold text-surface-900 dark:text-white">
                        {coordinator.bookings} bookings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
            {/* Pie Chart Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-surface-400" />
                  Room Usage Distribution (Pie Chart)
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
                  <div className="space-y-1.5 flex-1 max-w-[200px] max-h-48 overflow-y-auto pr-1">
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
                  Hours Used Per Room (Bar Chart)
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
                <div className="h-64 flex items-end gap-3 lg:gap-4 border-b border-l border-surface-200 dark:border-surface-700 pb-2 pl-2 overflow-x-auto">
                  {(data?.roomStats || []).map((item) => {
                    const heightPercent = maxHoursUsed > 0 ? (item.totalHoursUsed / maxHoursUsed) * 100 : 0;
                    return (
                      <div
                        key={item.roomNumber}
                        className="flex-1 min-w-[32px] flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hours tag on hover */}
                        <div className="absolute bottom-full mb-1 bg-surface-900 dark:bg-surface-950 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
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

                        {/* Bottom label */}
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
          <div className="card overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-25 dark:bg-surface-850/50">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                Room Statistics Table
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Room Name</th>
                    <th>Building</th>
                    <th>Capacity</th>
                    <th>Total Bookings</th>
                    <th>Total Hours Used</th>
                    <th>Total Participants</th>
                    <th>Occupancy %</th>
                    <th>Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.roomStats || []).map((item) => (
                    <tr key={item.roomNumber}>
                      <td className="font-semibold text-surface-900 dark:text-white">
                        {item.roomNumber}
                      </td>
                      <td>{item.building}</td>
                      <td>
                        {item.capacity === 0 ? (
                          <span className="text-surface-400 dark:text-surface-500 italic">Unknown Capacity</span>
                        ) : (
                          `${item.capacity} seats`
                        )}
                      </td>
                      <td className="tabular-nums">{item.totalBookings}</td>
                      <td className="tabular-nums">{item.totalHoursUsed} hrs</td>
                      <td className="tabular-nums">{item.totalParticipants}</td>
                      <td className="font-semibold tabular-nums">
                        {item.occupancyPercentage === null ? (
                          <span className="text-surface-450 dark:text-surface-500 italic text-xs font-normal">
                            Unknown Capacity
                          </span>
                        ) : (
                          `${item.occupancyPercentage}%`
                        )}
                      </td>
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

          {/* Manage Uploaded Datasets section */}
          <div className="card overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-25 dark:bg-surface-850/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                  Manage Uploaded Datasets
                </h2>
                <p className="text-xs text-surface-400">View and remove uploaded historical record batches.</p>
              </div>
            </div>

            {isBatchesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
              </div>
            ) : batches.length === 0 ? (
              <div className="p-8 text-center text-xs text-surface-400">
                No uploaded datasets found. Use "Upload Data" to import previous records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Source File Name</th>
                      <th>Records Count</th>
                      <th>Uploaded At</th>
                      <th>Uploaded By</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.importBatchId}>
                        <td className="font-semibold text-surface-900 dark:text-white">
                          {b.sourceFileName}
                        </td>
                        <td className="tabular-nums font-medium">{b.recordCount} rows</td>
                        <td className="text-xs text-surface-500 font-mono">{formatBatchDate(b.uploadedAt)}</td>
                        <td>{b.uploadedBy}</td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDeleteBatch(b)}
                            className="p-1.5 rounded text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 hover:text-danger-700 transition-colors inline-flex"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════ Excel Upload Modal ══════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!isUploading) {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadResult(null);
              }
            }}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 animate-slide-up max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                  Upload Historical Data
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Import booking records from Excel files. Invalid rows will be skipped.
                </p>
              </div>
              <button
                disabled={isUploading}
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadResult(null);
                }}
                className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* File Dropzone */}
              {!uploadResult && (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-surface-300 dark:border-surface-650 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg p-6 text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <Upload className="w-8 h-8 mx-auto text-surface-400 mb-2" />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 block">
                      {selectedFile ? selectedFile.name : 'Choose Excel file (.xlsx, .xls) or drag it here'}
                    </span>
                    {selectedFile && (
                      <span className="text-[10px] text-surface-450 mt-1 block">
                        Size: {Math.round(selectedFile.size / 1024)} KB
                      </span>
                    )}
                  </div>

                  {/* Requirements List */}
                  <div className="bg-surface-50 dark:bg-surface-850 p-4 rounded border border-surface-200 dark:border-surface-700 space-y-2 text-xs">
                    <h4 className="font-bold text-surface-800 dark:text-surface-200">Excel Column Format:</h4>
                    <ul className="list-disc pl-4 text-surface-600 dark:text-surface-400 space-y-1">
                      <li>
                        <strong className="text-surface-750 dark:text-surface-200">Required:</strong>{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Hall Name</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Date</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Start Time</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">End Time</code>
                      </li>
                      <li>
                        <strong className="text-surface-750 dark:text-surface-200">Optional:</strong>{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Booked By</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Email</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Mobile No</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Purpose</code>,{' '}
                        <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded font-mono text-[10px]">Number of People</code>
                      </li>
                      <li>Time must be in 24h format (<code className="text-[10px]">HH:MM</code>, e.g. <code className="text-[10px]">09:00</code> or <code className="text-[10px]">17:30</code>) or standard Excel serial format.</li>
                      <li>Date must be in <code className="text-[10px]">YYYY-MM-DD</code> or standard Excel date format.</li>
                    </ul>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFile(null);
                      }}
                      className="btn-secondary flex-1 justify-center"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={!selectedFile || isUploading} className="btn-primary flex-1 justify-center">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading & Validating...
                        </>
                      ) : (
                        'Upload File'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Upload Result Report */}
              {uploadResult && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-850 dark:text-emerald-450 text-xs">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                    <div>
                      <span className="font-bold block">Excel file import process finished.</span>
                      <span>
                        Successfully imported {uploadResult.importedRows} rows. Skipped {uploadResult.failedRows} invalid rows.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
                    <div className="bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-650 p-2.5 rounded">
                      <div className="text-surface-800 dark:text-white text-lg font-bold">{uploadResult.totalRows}</div>
                      <div className="text-surface-500 text-[10px] mt-0.5">Total Rows</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-2.5 rounded">
                      <div className="text-emerald-700 dark:text-emerald-400 text-lg font-bold">{uploadResult.importedRows}</div>
                      <div className="text-surface-500 text-[10px] mt-0.5 font-normal text-emerald-600 dark:text-emerald-500">Imported</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-2.5 rounded">
                      <div className="text-red-700 dark:text-red-400 text-lg font-bold">{uploadResult.failedRows}</div>
                      <div className="text-surface-500 text-[10px] mt-0.5 font-normal text-red-600 dark:text-red-500">Failed</div>
                    </div>
                  </div>

                  {uploadResult.failedDetails && uploadResult.failedDetails.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Skipped Rows Details:
                      </div>
                      <div className="max-h-60 overflow-y-auto border border-red-100 dark:border-red-950/40 rounded-lg p-3 text-[11px] font-mono text-red-800 dark:text-red-400 bg-red-50/20 dark:bg-red-950/10 space-y-1">
                        {uploadResult.failedDetails.map((det: any, idx: number) => (
                          <div key={idx} className="border-b border-red-100/30 dark:border-red-950/30 pb-1 last:border-0 last:pb-0">
                            <strong className="text-red-900 dark:text-red-300">Row {det.row}:</strong> {det.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Done button */}
                  <div className="pt-3 border-t border-surface-200 dark:border-surface-700 flex justify-end">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      className="btn-primary py-1.5 px-6"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
