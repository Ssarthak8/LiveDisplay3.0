<h1 align="center">
  RoomSync
</h1>

<p align="center">
  <strong>Real-Time Room Scheduling & Live Display System</strong>
</p>

<p align="center">
  Enterprise-grade scheduling solution for managing rooms, lectures, meetings, and events with real-time updates and professional digital signage.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Environment Setup](#environment-setup)
- [Local Development Setup](#local-development-setup)
- [MongoDB Setup](#mongodb-setup)
- [User Roles & Permissions](#user-roles--permissions)
- [Authentication Flow](#authentication-flow)
- [Schedule Conflict Detection](#schedule-conflict-detection)
- [TV Display System](#tv-display-system)
- [Display Content Management](#display-content-management)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Overview

RoomSync is a full-stack room scheduling system designed for corporate offices, educational institutions, and enterprise environments. It provides:

- **Real-time schedule management** with automatic conflict detection
- **Role-based access control (RBAC)** with three distinct roles
- **Professional TV display** for digital signage in lobbies and corridors
- **Comprehensive audit logging** for compliance and accountability
- **Live updates** via Socket.IO — no page refresh required

---

## Features

### Core Scheduling
- Create, edit, and delete room bookings with conflict detection
- Support for Lectures, Meetings, Trainings, and Seminars
- Automatic status tracking: Ongoing → Upcoming → Completed
- Calendar and list view modes
- Multi-field filtering and sorting

### Room Management
- Register rooms with building/capacity metadata
- Real-time occupancy tracking
- Conflict prevention across rooms

### User Management (SuperAdmin)
- Create, update, and deactivate users
- Forced password change on first login
- Password reset with temporary credentials

### TV Display / Digital Signage
- Professional split-layout display for wall-mounted TVs
- Real-time event cards with progress bars
- Slideshow carousel for announcements and posters
- Large digital clock with live connection indicator
- Room availability grid
- Automatic cursor hide for kiosk mode

### Display Content Management (SuperAdmin)
- Upload JPG/PNG/WebP images for TV slideshow
- Toggle active/inactive state per item
- Reorder content with up/down controls
- Configurable display duration per slide (5–120 seconds)

### Audit Logging
- Tracks all schedule, room, user, and display content changes
- Denormalized performer information for historical accuracy
- Filterable by action type, resource type, and date range

---

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│   Browser    │◄──►│   Express    │◄──►│   MongoDB     │
│   (React)    │    │   Server     │    │   Database    │
│              │    │              │    │               │
│  Vite + TS   │    │  REST API    │    │  Mongoose     │
│  TanStack    │    │  Socket.IO   │    │  ODM          │
│  Zustand     │    │  JWT Auth    │    │               │
└─────────────┘    └──────────────┘    └───────────────┘
       ▲                   ▲
       │    WebSocket      │
       └───────────────────┘
```

The application is structured as a **monorepo** with npm workspaces:

| Package | Description |
|---------|-------------|
| `packages/shared-types` | Zod schemas and TypeScript types shared between client and server |
| `apps/server` | Express.js REST API + Socket.IO server |
| `apps/client` | React SPA built with Vite |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 6 | Build tool and dev server |
| TanStack Query | Server state management and caching |
| Zustand | Client state management (auth store) |
| React Router 7 | Client-side routing |
| Socket.IO Client | Real-time WebSocket communication |
| Tailwind CSS 4 | Utility-first styling |
| Lucide React | Icon library |
| React Hot Toast | Notification toasts |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express 4 | HTTP framework |
| TypeScript | Type safety |
| Mongoose 8 | MongoDB ODM |
| Socket.IO 4 | Real-time WebSocket server |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Zod | Request validation |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB | Primary database |
| mongodb-memory-server | In-memory fallback for development |

---

## Folder Structure

```
room-scheduler/
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Monorepo root
│
├── packages/
│   └── shared-types/             # Shared Zod schemas & TS types
│       └── src/
│           ├── index.ts          # Re-exports
│           ├── user.ts           # User/Auth schemas
│           ├── room.ts           # Room schemas
│           ├── schedule.ts       # Schedule schemas
│           ├── audit.ts          # Audit log schemas
│           ├── display-content.ts # Display content schemas
│           ├── api.ts            # API response types
│           └── socket-events.ts  # Socket.IO event types
│
├── apps/
│   ├── server/                   # Express backend
│   │   └── src/
│   │       ├── index.ts          # Server entry point
│   │       ├── app.ts            # Express app setup
│   │       ├── socket.ts         # Socket.IO initialization
│   │       ├── config/
│   │       │   ├── db.ts         # MongoDB connection
│   │       │   └── env.ts        # Environment validation
│   │       ├── models/
│   │       │   ├── User.ts
│   │       │   ├── Room.ts
│   │       │   ├── Schedule.ts
│   │       │   ├── AuditLog.ts
│   │       │   └── DisplayContent.ts
│   │       ├── services/
│   │       │   ├── auth.service.ts
│   │       │   ├── schedule.service.ts
│   │       │   ├── room.service.ts
│   │       │   ├── audit.service.ts
│   │       │   └── display-content.service.ts
│   │       ├── middleware/
│   │       │   ├── auth.middleware.ts
│   │       │   ├── validate.middleware.ts
│   │       │   ├── error.middleware.ts
│   │       │   └── upload.middleware.ts
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── schedule.routes.ts
│   │       │   ├── room.routes.ts
│   │       │   ├── user.routes.ts
│   │       │   ├── audit.routes.ts
│   │       │   └── display-content.routes.ts
│   │       └── utils/
│   │           ├── seed.ts
│   │           └── conflict.ts
│   │
│   └── client/                   # React frontend
│       └── src/
│           ├── main.tsx          # App entry
│           ├── index.css         # Design system
│           ├── routes/index.tsx  # Route definitions
│           ├── lib/
│           │   ├── api.ts        # Axios instance
│           │   └── utils.ts      # Utility functions
│           ├── stores/
│           │   └── authStore.ts  # Zustand auth state
│           ├── hooks/
│           │   ├── useApi.ts     # TanStack Query hooks
│           │   └── useSocketEvents.ts
│           ├── providers/
│           │   ├── SocketProvider.tsx
│           │   └── ThemeProvider.tsx
│           ├── components/
│           │   ├── layout/
│           │   │   ├── AdminLayout.tsx
│           │   │   └── ViewerLayout.tsx
│           │   └── calendar/
│           │       └── CalendarView.tsx
│           └── pages/
│               ├── admin/
│               │   ├── Dashboard.tsx
│               │   ├── Schedules.tsx
│               │   ├── Rooms.tsx
│               │   ├── AuditLogs.tsx
│               │   ├── Users.tsx
│               │   ├── DisplayContent.tsx
│               │   ├── Login.tsx
│               │   └── ChangePassword.tsx
│               ├── viewer/
│               │   ├── ViewerHome.tsx
│               │   ├── ViewerDashboard.tsx
│               │   └── Login.tsx
│               └── tv/
│                   └── TVDisplay.tsx
```

---

## Environment Setup

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/room-scheduler
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Client (prefix with VITE_)
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Local Development Setup

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **MongoDB** (optional — falls back to in-memory server)

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd room-scheduler

# 2. Install all dependencies (monorepo)
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your values

# 4. Build shared types
npm run build:types

# 5. Start both servers (concurrent)
npm run dev

# Or start them individually:
npm run dev:server    # Express on port 5000
npm run dev:client    # Vite on port 5173
```

### Seed Accounts (Development)

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | `superadmin@scheduler.com` | `SuperAdmin@123` |
| Admin | `admin@scheduler.com` | `Admin@123` |
| Viewer | `viewer@scheduler.com` | `Viewer@123` |

---

## MongoDB Setup

### Option 1: Local MongoDB
Install and run MongoDB Community Edition. The app connects to `mongodb://localhost:27017/room-scheduler` by default.

### Option 2: In-Memory (Automatic Fallback)
If local MongoDB is not running, the server automatically starts `mongodb-memory-server` and seeds sample data. Data is lost when the server stops — ideal for development/testing.

### Option 3: MongoDB Atlas
Set `MONGODB_URI` to your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/room-scheduler
```

---

## User Roles & Permissions

### Permission Matrix

| Permission | SuperAdmin | Admin | Viewer |
|---|:---:|:---:|:---:|
| Create schedules | ✅ | ✅ | ❌ |
| Edit schedules | ✅ | ❌ | ❌ |
| Delete schedules | ✅ | ❌ | ❌ |
| View all schedules | ✅ | ✅ | Assigned/Public |
| View conflict info | ✅ | ✅ | ❌ |
| Create/Edit/Delete rooms | ✅ | ❌ | ❌ |
| View rooms | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Reset passwords | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ |
| Manage display content | ✅ | ❌ | ❌ |

### Security Model
- **Backend-enforced**: All permission checks happen in Express middleware (`authorize()`)
- **Frontend conditional**: UI elements are hidden based on role, but **never relied upon for security**
- **JWT-based**: Tokens include `userId` and `role` claims, verified on every API request

---

## Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Server validates email/password against bcrypt hash
3. Server checks if user is active
4. JWT token generated with `userId` and `role` payload
5. Token returned to client, stored in Zustand store + localStorage
6. All subsequent API requests include `Authorization: Bearer <token>` header
7. If `mustChangePassword` is true, client redirects to `/change-password`
8. On 401 response, client auto-logs out and redirects to login

---

## Schedule Conflict Detection

When creating or updating a schedule, the server checks for time overlaps in the same room:

```
Conflict exists when:
  existingEvent.startTime < newEvent.endTime
  AND existingEvent.endTime > newEvent.startTime
```

If a conflict is found, the API returns:
- **HTTP 409 Conflict**
- Conflict details including the existing event title, time, room, and creator contact info
- Displayed as a prominent amber alert in the schedule form

---

## TV Display System & Digital Signage

The TV Display system transforms standard monitors and screens into a professional campus/office digital signage system. It is designed to run unattended on wall-mounted Full HD screens.

### TV Display Architecture

```
┌────────────────────────────────────────────────────────┐
│                      TV Display                        │
│   (Public /tv client, runs in Smart TV/Kiosk browser)   │
└───────────────────────────┬────────────────────────────┘
                            │
            Rest API Poll   │   Socket.io Events
            (30s backup)    │   (Real-Time Push)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Express Backend                     │
│               (Routes, Multer, Mongoose)               │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                        MongoDB                         │
│             (DisplayMedia, Room, Schedule)             │
└────────────────────────────────────────────────────────┘
```

1. **Client Lifecycle**: The `/tv` route is a public page that doesn't require authentication, allowing easy deployment to simple browsers.
2. **Real-Time Synchronisation**:
   - The client connects via **Socket.IO** to the server.
   - When a SuperAdmin uploads, deletes, reorders, or toggles display media, the server emits a `displayMedia:updated` event, prompting all TV screens to instantly invalidate their cache and fetch the updated slides.
   - Changes to schedules (`schedule:created`, `schedule:updated`, etc.) or rooms trigger immediate updates to the schedule list and room availability map.
3. **Resilience & Caching**: If the WebSocket connection drops, React Query's `refetchInterval` acts as a backup polling mechanism (every 30 seconds for active media and schedules) to recover the feed automatically.

---

### Digital Signage Layout

The TV Display uses a high-contrast, space-optimised **60/40 split-screen layout**:

```
┌────────────────────────────────────┬──────────────────────────────────┐
│                                    │           Clock & Date           │
│                                    │  Monospace 60px digital clock    │
│                                    ├──────────────────────────────────┤
│                                    │          Happening Now           │
│        Primary Content Area        │  - Max 5 active schedule cards   │
│               (60%)                │  - Ongoing ending soonest first  │
│        Digital Slideshow /         │  - Auto-rotates list on overflow │
│           Welcome Banner           │  - Progress indicators & details │
│                                    ├──────────────────────────────────┤
│                                    │           Room Status            │
│                                    │  - Real-time FREE/BUSY grid      │
│                                    │  - Up to 8 room cells            │
└────────────────────────────────────┴──────────────────────────────────┘
```

#### Left Panel: Primary Content Area (60% Width)
* **Slideshow**: Cycles through active digital posters, campus banners, and announcements.
* **Auto-rotation**: Rotation occurs every **8 seconds** in an infinite loop.
* **Fade Transitions**: Employs CSS opacity-fade transitions (`transition: opacity 1.0s ease-in-out`) for a sleek visual change without layout shifts.
* **Design Accents**: A subtle **25% dark overlay** (`bg-black/25`) is placed over slideshow images to improve readability of overlay text and ensure a premium visual appearance.
* **RoomSync Default Banner**: If no active slides exist in the database, a dark gradient screensaver banner displays the RoomSync logo, welcome statement, and features.
* **Fallback Mechanisms**: Image loading errors are handled gracefully (broken images are replaced with a fallback image). Skeletons are shown during the initial loading state.

#### Right Panel: Information Area (40% Width)
* **Top (Clock & Date)**: Large high-contrast live clock (monospace) alongside the day/date and a live connection health indicator (green ping dot).
* **Middle (Happening Now)**: Displays active schedules as compact cards with an integrated live progress bar.
  - **Limit**: Displays up to **5 schedules**.
  - **Sorting**: Prioritises ongoing schedules first (sorted by `endTime` ascending, soonest ending first), followed by upcoming schedules starting soonest.
  - **Overflow Cycling**: If more than 5 events match, the panel automatically rotates/pages through pages of 5 items every 6 seconds to prevent vertical scrolling or layout overflow.
* **Bottom (Room Status)**: Grid displaying availability for up to 8 rooms with real-time green/red state indicators.

---

### Display Media Management

SuperAdmins can manage the digital signage slideshow sequence at `/admin/display-media`.

```
Dashboard -> Admin Menu -> Display Media (/admin/display-media)
```

#### RBAC Permissions Matrix

| Capability | SuperAdmin | Admin | Viewer |
|---|:---:|:---:|:---:|
| View Slideshow Config | ✅ | ✅ | ❌ |
| Preview Signage Images | ✅ | ✅ | ❌ |
| Upload Signage Images | ✅ | ❌ | ❌ |
| Delete Signage Images | ✅ | ❌ | ❌ |
| Reorder Slideshow Sequence | ✅ | ❌ | ❌ |
| Enable/Disable Signage items | ✅ | ❌ | ❌ |

- **Admin Read-Only Access**: Admins can view the active sequence and preview images, but all action buttons (Upload, Reorder Up/Down, Delete, Toggle Active/Inactive) are hidden or disabled. A read-only notice is displayed.
- **SuperAdmin Write Access**: SuperAdmins have full access to modify the slideshow, reorder items, and manage uploads.

---

### Slideshow Workflow

```
[SuperAdmin Uploads Poster] ──► [Disk Storage + DB Entry] ──► [Real-Time Socket Event]
                                                                     │
┌────────────────────────────────────────────────────────────────────┘
▼
[TV Client Refreshes] ──► [Cycles through Active Items (8s)] ──► [Graceful Fallbacks if Empty]
```

1. **Upload**: SuperAdmin drops an image file (JPG, PNG, WebP) and types a title.
2. **Persistence**: The server saves the file to the disk storage, assigns it the highest order index (appended to the end), and creates a `DisplayMedia` MongoDB document.
3. **Push Notification**: The server broadcasts `displayMedia:updated` via WebSockets.
4. **Display**: TV screens receive the event, invalidate query caches, and immediately show the new slides in rotation.

---

### Image Upload Process

To ensure display quality on Full HD screens:
- **Allowed Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Maximum File Size**: **10 MB** (server and client enforced).
- **Recommended Resolution**: **1920 x 1080** (Landscape, 16:9 aspect ratio).

#### Client-side Validation:
Before triggering the upload API, the client checks the MIME type and size. If a file is oversized or an invalid format, a clear toast alert is displayed and the upload is blocked. An animated upload indicator shows processing progress.

#### Server-side Validation:
Multer middleware validates the file MIME type and rejects unsupported formats, returning a `400 Bad Request` with a JSON error. Size limits are enforced using `multer.limits.fileSize`.

---

## Database Model: DisplayMedia

```typescript
{
  title: string;          // Poster description
  imageUrl: string;       // Served relative path on server
  isActive: boolean;      // Enable/Disable flag
  displayOrder: number;   // Sequencing index
  uploadedBy: ObjectId;   // User reference (User Model)
  createdAt: Date;        // Auto mongoose timestamp
  updatedAt: Date;        // Auto mongoose timestamp
}
```

- **Indices**:
  - `{ displayOrder: 1 }`
  - `{ isActive: 1, displayOrder: 1 }`

---

## API Endpoints

### Display Media APIs

All modification routes (`POST`, `PUT`, `DELETE`) require **SuperAdmin** role authentication.

| Method | Endpoint | Auth Required | Body Params / Return Shape | Description |
|--------|----------|---------------|----------------------------|-------------|
| **GET** | `/api/display-media` | Optional | `data: DisplayMedia[]` | Gets all media items if Admin/SuperAdmin, active-only for public requests |
| **GET** | `/api/display-media/active` | No | `data: DisplayMedia[]` | Gets only active display media items |
| **POST** | `/api/display-media` | SuperAdmin | FormData (`image` file, optional `title`) | Uploads a new poster image |
| **PUT** | `/api/display-media/:id` | SuperAdmin | `{ isActive?: boolean, title?: string }` | Updates active state or title |
| **PUT** | `/api/display-media/reorder` | SuperAdmin | `{ orderedIds: string[] }` | Reorders slideshow sequencing |
| **DELETE**| `/api/display-media/:id` | SuperAdmin | `{ success: boolean }` | Deletes media record and disk file |

---

## Audit Logging

Every change to the digital signage media creates an audit entry in the `AuditLog` collection:

- **DISPLAY_MEDIA_CREATED**: Triggered when a new poster is uploaded.
- **DISPLAY_MEDIA_UPDATED**: Triggered when a slide is toggled active/inactive, renamed, or reordered.
- **DISPLAY_MEDIA_DELETED**: Triggered when a signage image is permanently removed.

Logs record the **User ID**, **Timestamp**, **Action Type**, **Resource Type** (`display-media`), and **Resource ID**.

---

## Deployment Guides

### Docker Deployment
The monorepo contains a `docker-compose.yml` that wraps the DB, backend, and frontend.

1. **Build and Run**:
   ```bash
   docker-compose up --build -d
   ```
2. **Persistent Volumes**: Signage images are stored in a persistent volume mapped to `apps/server/uploads/display-media`. Ensure the host folder has read/write permissions for the container.

### Nginx Deployment
For production servers serving both client SPA and server API:

```nginx
server {
    listen 80;
    server_name signage.roomsync.local;

    # Frontend Static files
    location / {
        root /var/www/roomsync/apps/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Uploaded Media Assets
    location /uploads/ {
        alias /var/www/roomsync/apps/server/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Raspberry Pi Deployment
Raspberry Pi 3/4/5 are excellent hardware platforms for digital signage TV displays.

1. **Operating System**: Flash Raspberry Pi OS (with Desktop).
2. **Autostart Kiosk Mode**:
   Edit or create the autostart configuration:
   ```bash
   mkdir -p ~/.config/lxsession/LXDE-pi/
   nano ~/.config/lxsession/LXDE-pi/autostart
   ```
   Add the following lines to disable screensaver and launch Chromium on boot:
   ```bash
   @xset s off
   @xset -dpms
   @xset s noblank
   @chromium-browser --kiosk --noerrdialogs --disable-infobars http://YOUR_SERVER_IP/tv
   ```
3. **Cursor Hiding**: Install `unclutter` to auto-hide mouse pointer immediately:
   ```bash
   sudo apt-get install unclutter
   # Add to autostart:
   @unclutter -idle 0.1 -root
   ```

### Android TV Deployment
For smart TVs running Android TV / Google TV:

1. **WebView App**: Download a specialized WebView/Digital Signage browser app from the Google Play Store (e.g., *Downloader*, *WebView Browser*, or *Fully Kiosk Browser*).
2. **Set Launch URL**: Configure the browser app's home URL to point to `http://YOUR_SERVER_IP/tv`.
3. **Autostart on Boot**: Use an autostart application manager (e.g. *Launch on Boot*) to configure the WebView browser to launch automatically when the TV is powered on.

### Smart TV Browser Deployment
Most modern smart TVs (Samsung Tizen, LG webOS) feature built-in web browsers:

1. Open the TV's web browser.
2. Navigate to `http://YOUR_SERVER_IP/tv`.
3. Save the page to the browser's bookmarks.
4. Set the browser window to full-screen mode (usually via the browser menu or TV remote aspect ratio settings).

### Full-Screen Kiosk Mode
When running the display on PCs or Intel NUCs, run the browser with command-line flags to remove standard browser window chrome:

- **Chrome/Chromium**:
  ```bash
  chrome.exe --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble http://YOUR_SERVER_IP/tv
  ```
- **Microsoft Edge**:
  ```bash
  msedge.exe --kiosk http://YOUR_SERVER_IP/tv --edge-kiosk-type=fullscreen
  ```

---

## Future Enhancements

- [ ] Support video signage loops (`.mp4`, `.webm`)
- [ ] Add display duration options customizable per poster
- [ ] PDF document slideshow integrations
- [ ] Emergency campus announcement override alert system
- [ ] Scheduling display media (e.g., run a banner only between specific dates)
- [ ] Multi-screen digital signage grouping (different playlists for different TV screens)

---

## Deployment Guide

### Build for Production

```bash
# Build everything
npm run build

# Or build individually
npm run build:types
cd apps/server && npm run build
cd apps/client && npm run build
```

### Server
```bash
cd apps/server
node dist/index.js
```

### Client
Serve the `apps/client/dist/` directory with any static file server (Nginx, Caddy, Vercel, etc.).

---

## Production Considerations

1. **JWT Secret**: Use a strong, random secret (32+ characters)
2. **MongoDB**: Use a replica set for high availability
3. **File Uploads**: Migrate from local disk to S3/GCS for scalability
4. **CORS**: Restrict `CORS_ORIGIN` to your exact production domain
5. **HTTPS**: Terminate TLS at the reverse proxy level
6. **Rate Limiting**: Add `express-rate-limit` to API routes
7. **Logging**: Replace `console.log` with a structured logger (Winston/Pino)

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `MONGODB_URI is required` | Create `.env` file from `.env.example` |
| `JWT_SECRET must be at least 10 characters` | Set a proper JWT secret in `.env` |
| Port 5000 already in use | Change `PORT` in `.env` or stop the other process |
| In-memory MongoDB errors | Install: `npm install mongodb-memory-server --workspace=apps/server` |
| Shared types not found | Run `npm run build:types` before starting |
| CORS errors in browser | Check `CORS_ORIGIN` matches your frontend URL |

---

## Future Enhancements

- [ ] Email notifications for schedule changes
- [ ] Recurring schedule support
- [ ] Room booking approval workflow
- [ ] Google Calendar / Outlook integration
- [ ] Multi-tenant support
- [ ] Mobile app (React Native)
- [ ] Video content support for TV display
- [ ] PDF announcement display
- [ ] QR code check-in for rooms

---

## Room Coordinator & Conflict Resolution Workflow

### Room Coordinator Feature
Every booking schedule requires the designation of a **Room Coordinator** and their **Mobile Number** (a validated 10-digit number).
This represents the primary contact person responsible for the booking, distinct from:
- **Faculty/Presenter**: The person leading the event.
- **Created By**: The admin or superadmin account that created the booking (which is stored silently for audit logs).

### Conflict Resolution Workflow
1. When a scheduling conflict is detected (overlapping room, date, and timeslots), the system blocks submission and triggers a `Scheduling Conflict Detected` alert.
2. The conflict dialog displays contact details of the conflicting booking:
   - **Faculty**
   - **Room Coordinator**
   - **Mobile Number**
   - **Room**
   - **Date**
   - **Time**
3. Instead of routing communications through a system administrator, users can directly contact the listed **Room Coordinator** using their mobile number to resolve the room conflict.

### Privacy Rules
- **Admin/SuperAdmin**: Full access to view, edit, and export Room Coordinator names and mobile numbers.
- **Viewer/Public**: Coordinator names and mobile numbers are strictly stripped from all public list views, detail endpoints, and calendar tooltips to preserve privacy.

---

## Analytics Dashboard & Excel Reports

The **Analytics Dashboard** is a dedicated module (`Admin → Analytics`) that provides a comprehensive overview of room utilization.

### Access Levels
- **SuperAdmin**: Full Access (View + Export + Manage)
- **Admin**: View + Export
- **Viewer**: No Access (cannot view or access the analytics route or APIs)

### Summary KPI Cards
The top of the dashboard displays four real-time KPI metrics cards:
- **Most Used Room**: Displays the room with the highest cumulative booked hours (along with building and hours).
- **Least Used Room**: Displays the room with the lowest cumulative booked hours (even if 0 hours).
- **Total Hours Used**: The sum of all booked hours across all rooms.
- **Total Bookings**: The total number of bookings in the selected timeframe.

### Utilization Calculations
- **Duration Formula**: Actual booked hours are calculated on a per-booking basis:
  `Hours Used = End Time - Start Time`
- **Room Utilization Percentage**: Calculated based on a standard 12-hour operational day (8:00 AM to 8:00 PM) for the range:
  `Utilization % = (Total Hours Used / (Number of Days in Range * 12)) * 100` (capped at 100%).

### Visualizations & Charts
- **Pie Chart**: A custom SVG-rendered chart displaying the relative share of total booked hours for each room.
- **Bar Chart**: A CSS-rendered bar chart displaying the absolute hours used per room.
- **Data Table**: A clean list showing room numbers, buildings, booking counts, total hours, and a progress bar showing utilization percentage.
- **Filters**: Quickly filter the charts and dashboard data by **This Week**, **This Month**, or a **Custom Date Range**.

### Excel Export Guide
Clicking **Export Excel** downloads a professionally formatted `.xlsx` report.
- **Spreadsheet Metadata**:
  - `Generated On`: Date of generation
  - `Generated By`: Name of the exporting administrator
  - `Date Range`: Selected range labels (e.g. This Week, Custom)
- **Columns Included**:
  - `Room Number`
  - `Building`
  - `Total Bookings`
  - `Total Hours Used`
  - `Utilization Percentage`

### Future Scalability Notes
- **Operational Hours Customization**: Ability to modify the 12-hour day constant (e.g. support 8-hour or 24-hour calculations).
- **Exclude Holidays/Weekends**: Filtering out weekends or official holidays from available hours calculations to reflect precise academic/business metrics.
- **Automated Monthly Subscriptions**: Set up scheduled emails sending the utilization Excel reports directly to management.
