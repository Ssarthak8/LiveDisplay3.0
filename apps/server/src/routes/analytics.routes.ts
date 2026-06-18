import { Router } from 'express';
import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';
import { HistoricalBooking } from '../models/HistoricalBooking.js';
import { AuditService } from '../services/audit.service.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { AppError } from '../services/auth.service.js';
import XLSX from 'xlsx';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// Configure multer memory storage for Excel parsing (Updated upload limit to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      ext === '.xlsx' ||
      ext === '.xls' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new AppError('Only Excel files (.xlsx, .xls) are allowed', 400) as any);
    }
  }
});

// Hardcoded historical capacities
const HISTORICAL_ROOM_CAPACITIES: Record<string, number> = {
  aap: 50,
  communication: 200,
  cr6: 50,
  disha: 40,
  drishti: 50,
  pragati: 50,
  prathibha: 50,
  prithvi: 50,
  saksham: 50,
  sankalp: 50,
  sauwad: 40,
  tej: 80,
  udaan: 50,
  vayu: 80
};

// Helper: Parse Excel Date format
function parseExcelDate(val: any): string | null {
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel base date is Dec 30, 1899
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return null;
}

// Helper: Parse Excel Time format
function parseExcelTime(val: any): string | null {
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(':').map(Number);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
      const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let h = Number(match[1]);
        const m = Number(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

// Helper: Convert HH:MM to duration in hours
function getDurationInHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  return Math.max(0, (endMin - startMin) / 60);
}

// Common calculations function
async function calculateStats(startDate: string, endDate: string) {
  const dbRooms = await Room.find().lean();
  const dbRoomMap = new Map<string, any>();
  for (const r of dbRooms) {
    dbRoomMap.set(r.roomNumber.trim().toLowerCase(), r);
  }

  const historicalBookings = await HistoricalBooking.find({
    date: { $gte: startDate, $lte: endDate }
  }).lean();

  const schedules = await Schedule.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('roomId').lean();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const numDays = Math.max(1, Math.round(timeDiff / (1000 * 60 * 60 * 24)) + 1);
  const availableHoursPerRoom = numDays * 12; // 8:00 AM - 8:00 PM (12 hours)

  interface RoomAccumulator {
    roomNumber: string;
    building: string;
    capacity: number;
    totalBookings: number;
    totalHoursUsed: number;
    totalParticipants: number;
    occupancySum: number;
    occupancyCount: number;
  }

  const roomStatsMap = new Map<string, RoomAccumulator>();

  // Initialize stats map with all DB rooms so they appear in table/charts
  for (const r of dbRooms) {
    const normName = r.roomNumber.trim().toLowerCase();
    const capacity = normName in HISTORICAL_ROOM_CAPACITIES 
      ? HISTORICAL_ROOM_CAPACITIES[normName] 
      : r.capacity;
    
    roomStatsMap.set(normName, {
      roomNumber: r.roomNumber,
      building: r.building,
      capacity,
      totalBookings: 0,
      totalHoursUsed: 0,
      totalParticipants: 0,
      occupancySum: 0,
      occupancyCount: 0
    });
  }

  const getOrCreateStats = (roomName: string, dbRoom?: any): RoomAccumulator => {
    const normName = roomName.trim().toLowerCase();
    let stats = roomStatsMap.get(normName);
    if (!stats) {
      const capacity = normName in HISTORICAL_ROOM_CAPACITIES 
        ? HISTORICAL_ROOM_CAPACITIES[normName] 
        : (dbRoom ? dbRoom.capacity : 0);
      
      stats = {
        roomNumber: roomName,
        building: dbRoom ? dbRoom.building : 'Historical',
        capacity,
        totalBookings: 0,
        totalHoursUsed: 0,
        totalParticipants: 0,
        occupancySum: 0,
        occupancyCount: 0
      };
      roomStatsMap.set(normName, stats);
    }
    return stats;
  };

  // Process current schedules
  for (const s of schedules) {
    const dbRoom = s.roomId as any;
    const roomName = dbRoom ? dbRoom.roomNumber : 'Unknown';
    const stats = getOrCreateStats(roomName, dbRoom);

    const duration = getDurationInHours(s.startTime, s.endTime);
    // Use assignedUsers.length, fallback to 0
    const participants = s.assignedUsers ? s.assignedUsers.length : 0;

    stats.totalBookings += 1;
    stats.totalHoursUsed += duration;
    stats.totalParticipants += participants;

    if (stats.capacity > 0) {
      const occPercent = (participants / stats.capacity) * 100;
      stats.occupancySum += occPercent;
      stats.occupancyCount += 1;
    }
  }

  // Process historical bookings
  for (const hb of historicalBookings) {
    const roomName = hb.hallName;
    const dbRoom = dbRoomMap.get(roomName.trim().toLowerCase());
    const stats = getOrCreateStats(roomName, dbRoom);

    const duration = getDurationInHours(hb.startTime, hb.endTime);
    const participants = hb.numberOfPeople || 0;

    stats.totalBookings += 1;
    stats.totalHoursUsed += duration;
    stats.totalParticipants += participants;

    if (stats.capacity > 0) {
      const occPercent = (participants / stats.capacity) * 100;
      stats.occupancySum += occPercent;
      stats.occupancyCount += 1;
    }
  }

  // Compute aggregate metrics
  let totalBookings = 0;
  let totalHoursUsed = 0;
  let totalParticipants = 0;
  let totalOccupancySum = 0;
  let totalOccupancyCount = 0;

  const roomStatsList = [];

  for (const [_, stats] of roomStatsMap) {
    const avgOccupancy = stats.occupancyCount > 0 
      ? Math.round(stats.occupancySum / stats.occupancyCount) 
      : (stats.capacity === 0 ? null : 0);

    const utilizationPercentage = availableHoursPerRoom > 0 
      ? Math.min(100, Math.round((stats.totalHoursUsed / availableHoursPerRoom) * 100))
      : 0;

    roomStatsList.push({
      roomId: stats.roomNumber, // Frontend maps by roomNumber / roomId string
      roomNumber: stats.roomNumber,
      building: stats.building,
      capacity: stats.capacity,
      totalBookings: stats.totalBookings,
      totalHoursUsed: Math.round(stats.totalHoursUsed * 10) / 10,
      totalParticipants: stats.totalParticipants,
      occupancyPercentage: avgOccupancy,
      utilizationPercentage
    });

    totalBookings += stats.totalBookings;
    totalHoursUsed += stats.totalHoursUsed;
    totalParticipants += stats.totalParticipants;
    totalOccupancySum += stats.occupancySum;
    totalOccupancyCount += stats.occupancyCount;
  }

  // Find most used room (by totalHoursUsed)
  let mostUsedRoom = null;
  const activeRooms = roomStatsList.filter(r => r.totalHoursUsed > 0);
  if (activeRooms.length > 0) {
    const mur = activeRooms.reduce((max, r) => r.totalHoursUsed > max.totalHoursUsed ? r : max, activeRooms[0]);
    mostUsedRoom = {
      roomNumber: mur.roomNumber,
      building: mur.building,
      hoursUsed: mur.totalHoursUsed
    };
  }

  // Find highest occupancy room
  let highestOccupancyRoom = null;
  const roomsWithOccupancy = roomStatsList.filter(r => r.occupancyPercentage !== null && r.totalBookings > 0);
  if (roomsWithOccupancy.length > 0) {
    const hor = roomsWithOccupancy.reduce((max, r) => r.occupancyPercentage! > max.occupancyPercentage! ? r : max, roomsWithOccupancy[0]);
    highestOccupancyRoom = {
      roomNumber: hor.roomNumber,
      building: hor.building,
      occupancyPercentage: hor.occupancyPercentage
    };
  }

  const averageOccupancyPercent = totalOccupancyCount > 0 
    ? Math.round((totalOccupancySum / totalOccupancyCount) * 10) / 10
    : 0;

  return {
    summary: {
      totalBookings,
      totalHoursUsed: Math.round(totalHoursUsed * 10) / 10,
      totalParticipants,
      mostUsedRoom,
      highestOccupancyRoom,
      averageOccupancyPercentage: averageOccupancyPercent
    },
    roomStats: roomStatsList
  };
}

// GET /api/analytics - Fetch aggregate statistics
router.get('/', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }

    const stats = await calculateStats(startDate as string, endDate as string);

    // Audit log analytics viewing
    await AuditService.log('ANALYTICS_VIEW', req.user!.userId, 'analytics', null, {
      startDate,
      endDate
    });

    res.json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/batches - List recent uploaded batches
router.get('/batches', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await HistoricalBooking.aggregate([
      {
        $group: {
          _id: '$importBatchId',
          sourceFileName: { $first: '$sourceFileName' },
          uploadedAt: { $first: '$uploadedAt' },
          uploadedBy: { $first: '$uploadedBy' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { uploadedAt: -1 } }
    ]);

    const populatedBatches = await Promise.all(
      batches.map(async (b) => {
        let userName = 'Unknown Admin';
        if (b.uploadedBy) {
          const user = await User.findById(b.uploadedBy).select('name').lean();
          if (user) userName = user.name;
        }
        return {
          importBatchId: b._id,
          sourceFileName: b.sourceFileName,
          uploadedAt: b.uploadedAt,
          uploadedBy: userName,
          recordCount: b.recordCount
        };
      })
    );

    res.json({ success: true, batches: populatedBatches });
  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/upload - Import Excel file with partial acceptance
router.post('/upload', authenticate, authorize('superadmin', 'admin'), upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Excel file is required' });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'The Excel file contains no data rows.' });
      return;
    }

    const keys = Object.keys(rows[0]);
    const REQUIRED_HEADERS = ['Hall Name', 'Date', 'Start Time', 'End Time'];
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !keys.includes(h));

    if (missingHeaders.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid Excel structure. Missing required columns: ${missingHeaders.join(', ')}`
      });
      return;
    }

    const failedDetails: { row: number; error: string }[] = [];
    const recordsToInsert = [];
    const importBatchId = crypto.randomUUID();
    const sourceFileName = req.file.originalname;
    const uploadedBy = new mongoose.Types.ObjectId(req.user!.userId);
    const uploadedAt = new Date();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Header is row 1

      const hallName = row['Hall Name'] ? String(row['Hall Name']).trim() : '';
      const rawDate = row['Date'];
      const rawStartTime = row['Start Time'];
      const rawEndTime = row['End Time'];

      const bookedBy = row['Booked By'] ? String(row['Booked By']).trim() : undefined;
      const email = row['Email'] ? String(row['Email']).trim() : undefined;
      const mobileNo = row['Mobile No'] ? String(row['Mobile No']).trim() : undefined;
      const purpose = row['Purpose'] ? String(row['Purpose']).trim() : undefined;
      const rawNumPeople = row['Number of People'];

      const rowErrors: string[] = [];

      if (!hallName) {
        rowErrors.push("Missing 'Hall Name'");
      }

      const parsedDate = parseExcelDate(rawDate);
      if (!parsedDate) {
        rowErrors.push("Missing or invalid 'Date'");
      }

      const parsedStartTime = parseExcelTime(rawStartTime);
      const parsedEndTime = parseExcelTime(rawEndTime);
      if (!parsedStartTime) {
        rowErrors.push("Missing or invalid 'Start Time'");
      }
      if (!parsedEndTime) {
        rowErrors.push("Missing or invalid 'End Time'");
      }

      if (parsedStartTime && parsedEndTime && parsedStartTime >= parsedEndTime) {
        rowErrors.push("'Start Time' must be before 'End Time'");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push("Invalid 'Email' format");
      }
      if (mobileNo && !/^\+?[\d-\s()]{7,15}$/.test(mobileNo)) {
        rowErrors.push("Invalid 'Mobile No' format");
      }

      let numberOfPeople = 0;
      if (rawNumPeople !== undefined && rawNumPeople !== null && String(rawNumPeople).trim() !== '') {
        const parsedNum = parseInt(rawNumPeople, 10);
        if (isNaN(parsedNum) || parsedNum < 0) {
          rowErrors.push("'Number of People' must be a non-negative integer");
        } else {
          numberOfPeople = parsedNum;
        }
      }

      if (rowErrors.length > 0) {
        failedDetails.push({
          row: rowNum,
          error: rowErrors.join(', ')
        });
      } else {
        recordsToInsert.push({
          bookedBy,
          email,
          mobileNo,
          date: parsedDate,
          startTime: parsedStartTime,
          endTime: parsedEndTime,
          hallName,
          purpose,
          numberOfPeople,
          importBatchId,
          sourceFileName,
          uploadedBy,
          uploadedAt
        });
      }
    }

    if (recordsToInsert.length > 0) {
      await HistoricalBooking.insertMany(recordsToInsert);
      await AuditService.log('ANALYTICS_UPLOAD', req.user!.userId, 'analytics', null, {
        importBatchId,
        sourceFileName,
        importedCount: recordsToInsert.length,
        failedCount: failedDetails.length
      });
    }

    res.json({
      success: true,
      totalRows: rows.length,
      importedRows: recordsToInsert.length,
      failedRows: failedDetails.length,
      failedDetails,
      importBatchId: recordsToInsert.length > 0 ? importBatchId : null
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/analytics/upload/:importBatchId - Delete uploaded batch
router.delete('/upload/:importBatchId', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { importBatchId } = req.params;
    const deleteResult = await HistoricalBooking.deleteMany({ importBatchId });

    await AuditService.log('ANALYTICS_UPLOAD_DELETE', req.user!.userId, 'analytics', null, {
      importBatchId,
      deletedCount: deleteResult.deletedCount
    });

    res.json({ success: true, deletedCount: deleteResult.deletedCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/export - Export Excel utilization report
router.get('/export', authenticate, authorize('superadmin', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }

    const stats = await calculateStats(startDate as string, endDate as string);
    const historicalBookings = await HistoricalBooking.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1, startTime: 1 }).lean();

    const wb = XLSX.utils.book_new();

    // Sheet 1: Room Statistics
    const sheet1Headers = ['Room Name', 'Capacity', 'Total Bookings', 'Total Hours Used', 'Total Participants', 'Occupancy %'];
    const sheet1Rows = stats.roomStats.map((item) => [
      item.roomNumber,
      item.capacity === 0 ? 'Unknown Capacity' : item.capacity,
      item.totalBookings,
      item.totalHoursUsed,
      item.totalParticipants,
      item.capacity === 0 ? 'Unknown Capacity' : `${item.occupancyPercentage}%`
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Rows]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Room Statistics');

    // Sheet 2: Uploaded Records
    const sheet2Headers = [
      'Booked By',
      'Email',
      'Mobile No',
      'Date',
      'Start Time',
      'End Time',
      'Hall Name',
      'Purpose',
      'Number of People'
    ];
    const sheet2Rows = historicalBookings.map((hb) => [
      hb.bookedBy || '',
      hb.email || '',
      hb.mobileNo || '',
      hb.date,
      hb.startTime,
      hb.endTime,
      hb.hallName,
      hb.purpose || '',
      hb.numberOfPeople
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Rows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Uploaded Records');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await AuditService.log('ANALYTICS_EXPORT', req.user!.userId, 'analytics', null, {
      startDate,
      endDate
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=room_utilization_${startDate}_to_${endDate}.xlsx`);
    res.send(buf);
  } catch (error) {
    next(error);
  }
});

export default router;
