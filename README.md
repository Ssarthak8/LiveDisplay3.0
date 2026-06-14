# 📅 RoomSync — Real-Time Room Scheduling & Live Display System

A production-grade web application for scheduling lectures, meetings, training sessions, and events in rooms/classrooms with real-time conflict detection, live TV displays, and role-based access control.

## 🏗️ Architecture

```
room-scheduler/
├── packages/shared-types/     # Shared TypeScript types & Zod schemas
├── apps/server/               # Express + Socket.IO + MongoDB backend
├── apps/client/               # React + Vite + Tailwind CSS frontend
├── docker-compose.yml         # Docker deployment
└── .env                       # Environment configuration
```

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, React Query v5, Zustand, Socket.IO Client, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT, bcryptjs, Zod
- **Database:** MongoDB 7
- **Real-Time:** Socket.IO (WebSocket)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **MongoDB** 7+ (running locally or MongoDB Atlas)

### Setup

```bash
# 1. Install all dependencies
npm install

# 2. Build shared types
npm run build:types

# 3. Seed the database (creates default users + sample data)
npm run seed

# 4. Start both server and client in development mode
npm run dev
```

The app will be available at:
- **Viewer Portal:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin
- **TV Display:** http://localhost:5173/tv
- **API Server:** http://localhost:5000

### Default Credentials

| Role      | Email                    | Password      |
|-----------|--------------------------|---------------|
| Admin     | admin@scheduler.com      | Admin@123     |
| Scheduler | scheduler@scheduler.com  | Scheduler@123 |

## 📺 Application Modes

### Viewer Portal (`/`)
- Public access — no login required
- View all events with search & filters
- Status badges: 🟢 Ongoing, 🔵 Upcoming, ⚪ Completed
- Real-time updates via WebSocket
- **Does NOT display:** creator name, contact info, or audit data

### Admin Dashboard (`/admin`)
- Protected — requires login
- Dashboard with animated stats cards
- Full CRUD for schedules and rooms
- Conflict detection with creator contact details
- Audit log viewer
- Dark/Light mode toggle

### TV Display (`/tv`)
- Full-screen optimized for TVs and large displays
- Live digital clock
- Ongoing events with progress bars
- Upcoming events list
- Room status grid (green = free, red = occupied)
- Auto-hides cursor after 3 seconds
- Real-time updates via WebSocket

## 🔒 Conflict Detection

When creating or updating a schedule, the system checks for time overlaps in the same room:

```
Room A101: 09:00–10:00 already booked
Attempt:   09:30–10:30
Result:    ❌ Rejected — shows existing booking details + creator contact info
```

## 🌐 API Endpoints

| Method | Endpoint                | Auth   | Description              |
|--------|-------------------------|--------|--------------------------|
| POST   | /api/auth/login         | No     | Login, returns JWT       |
| GET    | /api/auth/me            | Yes    | Current user profile     |
| GET    | /api/rooms              | No     | List all rooms           |
| POST   | /api/rooms              | Admin  | Create room              |
| PUT    | /api/rooms/:id          | Admin  | Update room              |
| DELETE | /api/rooms/:id          | Admin  | Delete room              |
| GET    | /api/schedules          | No     | List schedules (filter)  |
| GET    | /api/schedules/today    | No     | Today's schedules        |
| GET    | /api/schedules/stats    | Admin  | Dashboard stats          |
| GET    | /api/schedules/room/:id | No     | Room availability        |
| POST   | /api/schedules          | Admin  | Create schedule          |
| PUT    | /api/schedules/:id      | Admin  | Update schedule          |
| DELETE | /api/schedules/:id      | Admin  | Delete schedule          |
| GET    | /api/audit-logs         | Admin  | Paginated audit logs     |

## 🔌 Socket.IO Events

**Server → Client:**
- `schedule:created` — New schedule added
- `schedule:updated` — Schedule modified
- `schedule:deleted` — Schedule removed
- `room:created` / `room:updated` / `room:deleted` — Room changes

**Client → Server:**
- `join:viewer` — Join viewer broadcast group
- `join:tv` — Join TV display broadcast group
- `join:admin` — Join admin broadcast group

## 🐳 Docker Deployment

```bash
docker-compose up --build -d
```

Services:
- **MongoDB:** localhost:27017
- **API Server:** localhost:5000
- **Web Client:** localhost:5173

## ⚙️ Environment Variables

| Variable       | Default                                    | Description           |
|----------------|--------------------------------------------|-----------------------|
| PORT           | 5000                                       | Server port           |
| NODE_ENV       | development                                | Environment           |
| MONGODB_URI    | mongodb://localhost:27017/room-scheduler    | MongoDB connection    |
| JWT_SECRET     | (required)                                 | JWT signing secret    |
| JWT_EXPIRES_IN | 7d                                         | Token expiry          |
| CORS_ORIGIN    | http://localhost:5173                       | Allowed CORS origin   |
| VITE_API_URL   | http://localhost:5000/api                   | API base URL (client) |
| VITE_SOCKET_URL| http://localhost:5000                       | Socket URL (client)   |

## 📁 Database Collections

- **Users** — name, email, phone, department, role, passwordHash
- **Rooms** — roomNumber, building, capacity
- **Schedules** — title, type, faculty, roomId, date, startTime, endTime, description, createdBy, updatedBy
- **AuditLogs** — action, performedBy, scheduleId, details, timestamp

---

Built with ❤️ using the MERN stack + Socket.IO
