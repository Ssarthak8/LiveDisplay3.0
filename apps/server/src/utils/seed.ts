import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Schedule } from '../models/Schedule.js';
import { connectDB } from '../config/db.js';

export async function seedData() {
  console.log('🌱 Seeding database...\n');

  // Seed users only in development mode
  let admin = null;
  let superadmin = null;
  let viewer = null;

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    // Delete existing default users to ensure static IDs are applied
    await User.deleteMany({
      email: { $in: ['superadmin@scheduler.com', 'admin@scheduler.com', 'viewer@scheduler.com'] }
    });

    superadmin = await User.create({
      _id: new mongoose.Types.ObjectId('65d648b2b24345e69e38e6ca'),
      name: 'Super Admin',
      email: 'superadmin@scheduler.com',
      phone: '+1-555-000-0000',
      department: 'Administration',
      role: 'superadmin',
      passwordHash: 'SuperAdmin@123',
      mustChangePassword: false,
    });
    console.log('✅ Super Admin created: superadmin@scheduler.com / SuperAdmin@123');

    admin = await User.create({
      _id: new mongoose.Types.ObjectId('65d648b2b24345e69e38e6cb'),
      name: 'Admin User',
      email: 'admin@scheduler.com',
      phone: '+1-555-000-0001',
      department: 'Administration',
      role: 'admin',
      passwordHash: 'Admin@123',
      mustChangePassword: false,
    });
    console.log('✅ Admin user created: admin@scheduler.com / Admin@123');

    viewer = await User.create({
      _id: new mongoose.Types.ObjectId('65d648b2b24345e69e38e6cc'),
      name: 'Viewer User',
      email: 'viewer@scheduler.com',
      phone: '+1-555-000-0003',
      department: 'Computer Science',
      role: 'viewer',
      passwordHash: 'Viewer@123',
      mustChangePassword: false,
    });
    console.log('✅ Viewer user created: viewer@scheduler.com / Viewer@123');
  } else {
    // In production, just verify they exist or lookup if needed
    admin = await User.findOne({ email: 'admin@scheduler.com' });
    superadmin = await User.findOne({ email: 'superadmin@scheduler.com' });
    viewer = await User.findOne({ email: 'viewer@scheduler.com' });
    console.log('⏩ Production environment detected. Skipping default user seeding.');
  }

  // Clear existing rooms and schedules to align completely with the new master list
  await Room.deleteMany({});
  await Schedule.deleteMany({});

  // Seed rooms
  const rooms = [
    { roomNumber: 'Aap', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Communication', building: 'Main Building', capacity: 200 },
    { roomNumber: 'CR6', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Disha', building: 'Main Building', capacity: 40 },
    { roomNumber: 'Drishti', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Pragati', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Prathibha', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Prithvi', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Saksham', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Sankalp', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Sanwaad', building: 'Main Building', capacity: 40 },
    { roomNumber: 'Tej', building: 'Main Building', capacity: 80 },
    { roomNumber: 'Udaan', building: 'Main Building', capacity: 50 },
    { roomNumber: 'Vayu', building: 'Main Building', capacity: 80 },
  ];

  for (const roomData of rooms) {
    await Room.create(roomData);
    console.log(`✅ Room created: ${roomData.roomNumber} (${roomData.building})`);
  }

  // Seed sample schedules
  const room1 = await Room.findOne({ roomNumber: 'Aap' });
  const room2 = await Room.findOne({ roomNumber: 'Communication' });
  const room3 = await Room.findOne({ roomNumber: 'CR6' });

  if (admin && room1 && room2 && room3) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const schedules = [
      {
        title: 'Introduction to Computer Science',
        type: 'Lecture',
        faculty: 'Dr. Sarah Johnson',
        roomId: room1._id,
        date: dateStr,
        startTime: '09:00',
        endTime: '10:30',
        description: 'CS101 introductory lecture covering algorithms and data structures fundamentals.',
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: admin._id,
        assignedDepartment: 'Computer Science',
        assignedUsers: viewer ? [viewer._id] : [],
      },
      {
        title: 'Department Meeting',
        type: 'Meeting',
        faculty: 'Prof. Michael Chen',
        roomId: room2._id,
        date: dateStr,
        startTime: '11:00',
        endTime: '12:00',
        description: 'Monthly department meeting to discuss curriculum changes.',
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: admin._id,
        assignedDepartment: null, // Public
        assignedUsers: [],
      },
      {
        title: 'Machine Learning Workshop',
        type: 'Training',
        faculty: 'Dr. Emily Williams',
        roomId: room3._id,
        date: dateStr,
        startTime: '14:00',
        endTime: '16:00',
        description: 'Hands-on workshop on neural networks and deep learning.',
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: admin._id,
        assignedDepartment: 'Computer Science',
        assignedUsers: [],
      },
      {
        title: 'Research Seminar: Quantum Computing',
        type: 'Seminar',
        faculty: 'Dr. James Wilson',
        roomId: room1._id,
        date: tomorrowStr,
        startTime: '10:00',
        endTime: '11:30',
        description: 'Guest lecture on quantum computing advances.',
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: admin._id,
        assignedDepartment: null, // Public
        assignedUsers: [],
      },
      {
        title: 'Data Structures Lab',
        type: 'Lecture',
        faculty: 'Dr. Sarah Johnson',
        roomId: room2._id,
        date: tomorrowStr,
        startTime: '13:00',
        endTime: '15:00',
        description: 'Practical lab session on trees and graphs.',
        roomCoordinator: 'Rohit',
        coordinatorMobileNumber: '1234567890',
        createdBy: admin._id,
        assignedDepartment: 'Information Technology', // Assigned to other department, hidden for viewer
        assignedUsers: [],
      },
    ];

    const existingCount = await Schedule.countDocuments();
    if (existingCount === 0) {
      await Schedule.insertMany(schedules);
      console.log(`\n✅ ${schedules.length} sample schedules created`);
    } else {
      console.log(`\n⏩ Schedules already exist (${existingCount} found)`);
    }
  }

  console.log('\n🎉 Seeding complete!');
}

async function run() {
  await connectDB();
  await seedData();
  await mongoose.disconnect();
  process.exit(0);
}

// Only run if executing directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  run().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}
