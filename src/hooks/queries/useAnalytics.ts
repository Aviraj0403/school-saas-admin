import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export function useFullDashboard() {
  return useQuery({
    queryKey: ['analytics-full-dashboard'],
    queryFn: () => analyticsService.getFullDashboard(),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics-dashboard-stats'],
    queryFn: () => analyticsService.getDashboardStats(),
  });
}

export function useAttendanceTrend(classId?: string) {
  return useQuery({
    queryKey: ['analytics-attendance-trend', classId],
    queryFn: () => analyticsService.getAttendanceTrend(classId),
  });
}

export function useFeeCollectionTrend() {
  return useQuery({
    queryKey: ['analytics-fee-trend'],
    queryFn: () => analyticsService.getFeeCollectionTrend(),
  });
}

export function useHostelAnalytics() {
  return useQuery({
    queryKey: ['analytics-hostel'],
    queryFn: () => analyticsService.getHostelAnalytics(),
  });
}

export function useLeaveAnalytics(month?: number, year?: number) {
  return useQuery({
    queryKey: ['analytics-leave', { month, year }],
    queryFn: () => analyticsService.getLeaveAnalytics(month, year),
  });
}

export function useActivityLog(page: number, limit: number) {
  return useQuery({
    queryKey: ['analytics-activity-log', { page, limit }],
    queryFn: () => analyticsService.getActivityLog(page, limit),
    placeholderData: (previousData) => previousData,
  });
}
