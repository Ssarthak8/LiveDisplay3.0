import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Schedule } from '../models/Schedule.js';
import { AuditLog } from '../models/AuditLog.js';

async function check() {
  await connectDB();
  console.log('--- USERS ---');
  const users = await User.find().lean();
  for (const u of users) {
    console.log(`ID: ${u._id}, Name: "${u.name}", Email: "${u.email}", Role: "${u.role}"`);
  }

  console.log('\n--- SCHEDULES ---');
  const schedules = await Schedule.find().populate('createdBy').lean();
  for (const s of schedules) {
    const creator = s.createdBy as any;
    console.log(`Title: "${s.title}", createdBy ID: ${s.createdBy ? (creator._id || s.createdBy) : 'null'}, name: "${creator?.name || '—'}"`);
  }

  console.log('\n--- AUDIT LOGS ---');
  const logs = await AuditLog.find().populate('performedBy').lean();
  for (const l of logs) {
    const perf = l.performedBy as any;
    console.log(`Action: ${l.action}, performedBy ID: ${l.performedBy ? (perf._id || l.performedBy) : 'null'}, name: "${perf?.name || '—'}"`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(console.error);
