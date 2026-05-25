import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useFullDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-full-dashboard'],
    queryFn: () => analyticsService.getFullDashboard(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useDashboardStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-dashboard-stats'],
    queryFn: () => analyticsService.getDashboardStats(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useAttendanceTrend(classId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-attendance-trend', classId],
    queryFn: () => analyticsService.getAttendanceTrend(classId),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useFeeCollectionTrend() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-fee-trend'],
    queryFn: () => analyticsService.getFeeCollectionTrend(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useHostelAnalytics() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-hostel'],
    queryFn: () => analyticsService.getHostelAnalytics(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useLeaveAnalytics(month?: number, year?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-leave', { month, year }],
    queryFn: () => analyticsService.getLeaveAnalytics(month, year),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useActivityLog(page: number, limit: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['analytics-activity-log', { page, limit }],
    queryFn: () => analyticsService.getActivityLog(page, limit),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}
