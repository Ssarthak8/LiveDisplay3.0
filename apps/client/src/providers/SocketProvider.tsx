import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, type TypedSocket } from '@/lib/socket';

const SocketContext = createContext<TypedSocket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
  room?: 'viewer' | 'tv' | 'admin';
}

export function SocketProvider({ children, room = 'viewer' }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    s.on('connect', () => {
      console.log('🔌 Socket connected');
      // Join the appropriate room
      if (room === 'viewer') s.emit('join:viewer');
      else if (room === 'tv') s.emit('join:tv');
      else if (room === 'admin') s.emit('join:admin');
    });

    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    return () => {
      disconnectSocket();
    };
  }, [room]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
