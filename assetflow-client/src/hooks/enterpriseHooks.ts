import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { reportService } from '../services/reportService';
import { notificationService } from '../services/notificationService';
import { logService } from '../services/logService';
import { aiService } from '../services/aiService';
import { settingsService } from '../services/settingsService';
import { searchService } from '../services/searchService';

// ----------------------------------------------------
// Executive Dashboard Hooks
// ----------------------------------------------------
export function useExecutiveStats() {
  return useQuery({
    queryKey: ['executive-stats'],
    queryFn: () => dashboardService.getExecutiveStats(),
    refetchInterval: 30000 // refresh every 30s
  });
}

// ----------------------------------------------------
// Reports Hooks
// ----------------------------------------------------
export function useReportData(type: string) {
  return useQuery({
    queryKey: ['reports', type],
    queryFn: () => reportService.getReportData({ type }),
    enabled: !!type
  });
}

// ----------------------------------------------------
// Notifications Hooks
// ----------------------------------------------------
export function useNotifications(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params)
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => notificationService.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

// ----------------------------------------------------
// Activity Logs Hooks
// ----------------------------------------------------
export function useActivityLogs(params?: {
  search?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => logService.getActivityLogs(params)
  });
}

// ----------------------------------------------------
// Gemini AI Assistant Hooks
// ----------------------------------------------------
export function useAiChat() {
  return useMutation({
    mutationFn: (message: string) => aiService.chatWithGemini(message)
  });
}

// ----------------------------------------------------
// Settings Hooks
// ----------------------------------------------------
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
}

// ----------------------------------------------------
// Global Search Hooks
// ----------------------------------------------------
export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ['global-search', q],
    queryFn: () => searchService.globalSearch(q),
    enabled: !!q && q.trim().length > 0,
    staleTime: 5000
  });
}
