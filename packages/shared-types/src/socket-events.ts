import type { Schedule } from './schedule.js';
import type { Room } from './room.js';

export interface ServerToClientEvents {
  'schedule:created': (schedule: Schedule) => void;
  'schedule:updated': (schedule: Schedule) => void;
  'schedule:deleted': (data: { id: string }) => void;
  'room:created': (room: Room) => void;
  'room:updated': (room: Room) => void;
  'room:deleted': (data: { id: string }) => void;
  'displayContent:updated': () => void;
  'displayMedia:updated': () => void;
  'announcements:updated': () => void;
}

export interface ClientToServerEvents {
  'join:viewer': () => void;
  'join:tv': () => void;
  'join:admin': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  role?: string;
}
