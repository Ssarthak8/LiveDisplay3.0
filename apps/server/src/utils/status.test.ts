import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getScheduleStatus, combineDateAndTime, getTodayDate } from './status.js';
import { ScheduleService } from '../services/schedule.service.js';
import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { User } from '../models/User.js';

test('Timezone and Status Utility Tests', async (t) => {
  await t.test('getTodayDate returns YYYY-MM-DD relative to timezone', () => {
    // Current date/time
    const todayLocal = getTodayDate();
    assert.match(todayLocal, /^\d{4}-\d{2}-\d{2}$/);

    const kolkataToday = getTodayDate('Asia/Kolkata');
    assert.match(kolkataToday, /^\d{4}-\d{2}-\d{2}$/);

    const utcToday = getTodayDate('UTC');
    assert.match(utcToday, /^\d{4}-\d{2}-\d{2}$/);

    // Fallback to local on invalid timezone
    const fallbackToday = getTodayDate('Invalid/Timezone');
    assert.strictEqual(fallbackToday, todayLocal);
  });

  await t.test('combineDateAndTime combines date and time in specific timezone', () => {
    // 2026-06-16 12:00 in Asia/Kolkata (GMT+5:30) is 2026-06-16 06:30 UTC
    const dateKolkata = combineDateAndTime('2026-06-16', '12:00', 'Asia/Kolkata');
    assert.strictEqual(dateKolkata.toISOString(), '2026-06-16T06:30:00.000Z');

    // 2026-06-16 12:00 in America/New_York (GMT-4:00/EDT in June) is 2026-06-16 16:00 UTC
    const dateNY = combineDateAndTime('2026-06-16', '12:00', 'America/New_York');
    assert.strictEqual(dateNY.toISOString(), '2026-06-16T16:00:00.000Z');

    // 2026-06-16 12:00 in UTC is 2026-06-16 12:00 UTC
    const dateUTC = combineDateAndTime('2026-06-16', '12:00', 'UTC');
    assert.strictEqual(dateUTC.toISOString(), '2026-06-16T12:00:00.000Z');
  });

  await t.test('getScheduleStatus calculates statuses correctly relative to time', () => {
    const tz = 'UTC';
    // Use fixed dates relative to current time to ensure test passes deterministically
    const now = new Date();
    const todayStr = getTodayDate(tz);

    // Create an ongoing event in UTC: starts 10 minutes ago, ends 10 minutes from now
    const tenMinsAgo = new Date(now.getTime() - 10 * 60000);
    const tenMinsHence = new Date(now.getTime() + 10 * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    
    // We format these hours/minutes relative to UTC
    const startHour = tenMinsAgo.getUTCHours();
    const startMin = tenMinsAgo.getUTCMinutes();
    const endHour = tenMinsHence.getUTCHours();
    const endMin = tenMinsHence.getUTCMinutes();

    const startStr = `${pad(startHour)}:${pad(startMin)}`;
    const endStr = `${pad(endHour)}:${pad(endMin)}`;

    // If the event spans across days, let's adjust for tests if it falls around midnight
    // Since now is in the middle of these, getScheduleStatus should return 'ongoing' if date matches todayStr
    const status = getScheduleStatus(todayStr, startStr, endStr, tz);
    assert.strictEqual(status, 'ongoing');
  });
});

test('Integration: Schedule Statistics and Timezone Consistency', async (t) => {
  let mongod: MongoMemoryServer;
  
  t.before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  await t.test('getStats counts match getToday schedule status mappings', async () => {
    // 1. Create a User and a Room
    const user = await User.create({
      name: 'Test Admin',
      email: 'test-admin@scheduler.com',
      phone: '+1-555-999-9999',
      department: 'Testing',
      role: 'admin',
      passwordHash: 'dummy',
    });

    const room = await Room.create({
      roomNumber: 'Aap',
      building: 'Test Building',
      capacity: 50,
    });

    // 2. We want to test different timezones, let's simulate with 'Asia/Kolkata' (GMT+5:30)
    const tz = 'Asia/Kolkata';
    const todayKolkata = getTodayDate(tz);

    // Create schedules for today in Kolkata
    // - Event 1: Ongoing in Kolkata
    // - Event 2: Upcoming in Kolkata
    // - Event 3: Completed in Kolkata
    // We base these on current time in Kolkata
    const kolkataNow = combineDateAndTime(todayKolkata, '12:00', tz); // Mock reference "now" relative date
    // Note: getScheduleStatus compares with "new Date()", which is the absolute current time.
    // Let's compute actual start/end relative to current absolute time (now).
    const absoluteNow = new Date();
    
    // Get formatted string in Asia/Kolkata timezone for current absolute time
    const getParts = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).formatToParts(d);
      const map = new Map(parts.map(p => [p.type, p.value]));
      let hr = Number(map.get('hour'));
      if (hr === 24) hr = 0;
      return [hr, Number(map.get('minute'))];
    };

    // Construct times relative to absolute current time in Kolkata
    const ongoingStart = new Date(absoluteNow.getTime() - 15 * 60000);
    const ongoingEnd = new Date(absoluteNow.getTime() + 15 * 60000);
    const upcomingStart = new Date(absoluteNow.getTime() + 60 * 60000);
    const upcomingEnd = new Date(absoluteNow.getTime() + 120 * 60000);
    const completedStart = new Date(absoluteNow.getTime() - 120 * 60000);
    const completedEnd = new Date(absoluteNow.getTime() - 60 * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatTZTime = (d: Date) => {
      const [h, m] = getParts(d);
      return `${pad(h)}:${pad(m)}`;
    };

    const scheduleData = [
      {
        title: 'Ongoing Kolkata Event',
        type: 'Lecture' as const,
        faculty: 'Faculty A',
        roomId: room._id,
        date: todayKolkata,
        startTime: formatTZTime(ongoingStart),
        endTime: formatTZTime(ongoingEnd),
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: user._id,
      },
      {
        title: 'Upcoming Kolkata Event',
        type: 'Meeting' as const,
        faculty: 'Faculty B',
        roomId: room._id,
        date: todayKolkata,
        startTime: formatTZTime(upcomingStart),
        endTime: formatTZTime(upcomingEnd),
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: user._id,
      },
      {
        title: 'Completed Kolkata Event',
        type: 'Seminar' as const,
        faculty: 'Faculty C',
        roomId: room._id,
        date: todayKolkata,
        startTime: formatTZTime(completedStart),
        endTime: formatTZTime(completedEnd),
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: user._id,
      },
    ];

    await Schedule.insertMany(scheduleData);

    // Call getToday and getStats with the same timezone
    const todaySchedules = await ScheduleService.getToday({ userId: user._id.toString(), role: 'admin' }, tz);
    const stats = await ScheduleService.getStats(tz);

    // Assert counts
    assert.strictEqual(todaySchedules.length, 3);
    assert.strictEqual(stats.todayTotal, 3);
    assert.strictEqual(stats.totalSchedulesToday, 3);

    // Filter statuses from todaySchedules
    const ongoingCount = todaySchedules.filter((s: any) => s.status === 'ongoing').length;
    const upcomingCount = todaySchedules.filter((s: any) => s.status === 'upcoming').length;

    assert.strictEqual(stats.ongoing, ongoingCount, 'Ongoing count must match count from list');
    assert.strictEqual(stats.ongoingEvents, ongoingCount, 'OngoingEvents count must match count from list');
    assert.strictEqual(stats.upcoming, upcomingCount, 'Upcoming count must match count from list');
    assert.strictEqual(stats.upcomingEvents, upcomingCount, 'UpcomingEvents count must match count from list');
  });
});
