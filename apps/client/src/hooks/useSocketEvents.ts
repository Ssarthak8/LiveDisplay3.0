import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';

/**
 * Hook that listens for Socket.IO events and invalidates React Query caches.
 */
export function useSocketEvents() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleScheduleCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    };

    const handleScheduleUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    };

    const handleScheduleDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    };

    const handleRoomCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    };

    const handleRoomUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    };

    const handleRoomDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    };

    socket.on('schedule:created', handleScheduleCreated);
    socket.on('schedule:updated', handleScheduleUpdated);
    socket.on('schedule:deleted', handleScheduleDeleted);
    socket.on('room:created', handleRoomCreated);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:deleted', handleRoomDeleted);

    return () => {
      socket.off('schedule:created', handleScheduleCreated);
      socket.off('schedule:updated', handleScheduleUpdated);
      socket.off('schedule:deleted', handleScheduleDeleted);
      socket.off('room:created', handleRoomCreated);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:deleted', handleRoomDeleted);
    };
  }, [socket, queryClient]);
}
