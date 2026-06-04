import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await api.get('/homework');
      return res.data?.data?.items || res.data?.items || [];
    },
  });
};

export const useStudentAssignments = (studentId: string) => {
  return useQuery({
    queryKey: ['assignments', 'student', studentId],
    queryFn: async () => {
      const res = await api.get(`/homework/student/${studentId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!studentId,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/homework', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, payload }: { submissionId: string; payload: any }) => {
      const res = await api.patch(`/homework/submissions/${submissionId}/grade`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, payload }: { assignmentId: string; payload: any }) => {
      const res = await api.post(`/homework/${assignmentId}/submit`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
