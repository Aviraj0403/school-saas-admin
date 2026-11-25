import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useAssignments = (filters?: { classId?: string; subjectId?: string }) => {
  return useQuery({
    queryKey: ['assignments', 'list', filters?.classId ?? '', filters?.subjectId ?? ''],
    queryFn: async () => {
      const res = await api.get('/homework', {
        params: {
          limit: 100,
          ...(filters?.classId ? { classId: filters.classId } : {}),
          ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
        },
      });
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

/** Assignment with its submissions (GET /homework/:id). */
export const useAssignmentDetail = (id?: string) => {
  return useQuery({
    queryKey: ['assignments', 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/homework/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
    retry: false,
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.patch(`/homework/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/homework/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
