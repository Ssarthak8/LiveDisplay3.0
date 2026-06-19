import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ScheduleFilters } from '@room-scheduler/shared-types';

export function useSchedules(filters: ScheduleFilters = {}) {
  return useQuery({
    queryKey: ['schedules', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, String(value));
        }
      });
      const { data } = await api.get(`/schedules?${params.toString()}`);
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s as fallback
  });
}

export function useTodaySchedules() {
  return useQuery({
    queryKey: ['today-schedules'],
    queryFn: async () => {
      const { data } = await api.get('/schedules/today');
      return data;
    },
    refetchInterval: 15000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/schedules/stats');
      return data.data;
    },
    refetchInterval: 15000,
  });
}

export function useRoomSchedules(roomId: string, date?: string) {
  return useQuery({
    queryKey: ['room-schedules', roomId, date],
    queryFn: async () => {
      const params = date ? `?date=${date}` : '';
      const { data } = await api.get(`/schedules/room/${roomId}${params}`);
      return data;
    },
    enabled: !!roomId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleData: Record<string, unknown>) => {
      const { data } = await api.post('/schedules', scheduleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: result } = await api.put(`/schedules/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/schedules/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedules'] });
    },
  });
}

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get('/rooms');
      return data.data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomData: Record<string, unknown>) => {
      const { data } = await api.post('/rooms', roomData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: result } = await api.put(`/rooms/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/rooms/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useAuditLogs(page: number = 1, filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const { data } = await api.get(`/audit-logs?${params.toString()}`);
      return data;
    },
  });
}

export function useUsers(search: string = '', page: number = 1) {
  return useQuery({
    queryKey: ['users', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/users?${params.toString()}`);
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: Record<string, unknown>) => {
      const { data } = await api.post('/users', userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: result } = await api.put(`/users/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/users/${id}/reset-password`);
      return data; // contains temporaryPassword
    },
  });
}

// ── Display Content Hooks ──

export function useDisplayContent() {
  return useQuery({
    queryKey: ['display-content'],
    queryFn: async () => {
      const { data } = await api.get('/display-content');
      return data.data;
    },
  });
}

export function useActiveDisplayContent() {
  return useQuery({
    queryKey: ['display-content-active'],
    queryFn: async () => {
      const { data } = await api.get('/display-content/active');
      return data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useUploadDisplayContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/display-content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-content'] });
      queryClient.invalidateQueries({ queryKey: ['display-content-active'] });
    },
  });
}

export function useUpdateDisplayContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: result } = await api.put(`/display-content/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-content'] });
      queryClient.invalidateQueries({ queryKey: ['display-content-active'] });
    },
  });
}

export function useDeleteDisplayContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/display-content/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-content'] });
      queryClient.invalidateQueries({ queryKey: ['display-content-active'] });
    },
  });
}

export function useReorderDisplayContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { data } = await api.put('/display-content/reorder/batch', { orderedIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-content'] });
    },
  });
}

// ── Display Media Hooks ──

export function useDisplayMedia() {
  return useQuery({
    queryKey: ['display-media'],
    queryFn: async () => {
      const { data } = await api.get('/display-media');
      return data.data;
    },
  });
}

export function useActiveDisplayMedia() {
  return useQuery({
    queryKey: ['display-media-active'],
    queryFn: async () => {
      const { data } = await api.get('/display-media?active=true');
      return data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });
}

export function useUploadDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/display-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-media'] });
      queryClient.invalidateQueries({ queryKey: ['display-media-active'] });
    },
  });
}

export function useUpdateDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { data: result } = await api.put(`/display-media/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-media'] });
      queryClient.invalidateQueries({ queryKey: ['display-media-active'] });
    },
  });
}

export function useDeleteDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/display-media/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-media'] });
      queryClient.invalidateQueries({ queryKey: ['display-media-active'] });
    },
  });
}

export function useReorderDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { data } = await api.put('/display-media/reorder', { orderedIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-media'] });
      queryClient.invalidateQueries({ queryKey: ['display-media-active'] });
    },
  });
}

// ── Announcement Hooks ──

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return data.data;
    },
  });
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ['announcements-active'],
    queryFn: async () => {
      const { data } = await api.get('/announcements/active');
      return data.data;
    },
    refetchInterval: 15000, // Refresh every 15s as fallback
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementData: { content: string; priority: 'Normal' | 'Important' }) => {
      const { data } = await api.post('/announcements', announcementData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-active'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; content?: string; priority?: 'Normal' | 'Important'; isActive?: boolean }) => {
      const { data: result } = await api.put(`/announcements/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-active'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/announcements/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-active'] });
    },
  });
}
