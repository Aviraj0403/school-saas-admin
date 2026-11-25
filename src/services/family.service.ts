import { api } from './api';
import { unwrap, asList } from '@/lib/utils';

/**
 * Parent / student self-service API. Every /family route returns one entry per
 * accessible child; we always pass ?studentId so the backend narrows (and
 * ownership-checks) to the child selected in the portal.
 */

export interface FamilyChild {
  id: string;
  name: string;
  classId?: string | null;
  admissionNo?: string | null;
  rollNo?: string | null;
}

async function familyGet<T = any>(path: string, params?: Record<string, any>): Promise<T[]> {
  const res = await api.get(`/family/${path}`, { params });
  return asList<T>(unwrap(res));
}

async function forStudent<T = any>(
  path: string,
  studentId: string,
  params?: Record<string, any>
): Promise<T | null> {
  const rows = await familyGet<any>(path, { studentId, ...params });
  return (rows.find((r) => r.studentId === studentId) ?? rows[0] ?? null) as T | null;
}

export const familyService = {
  /** Children the login may see, with names (from the fee-dues payload's `student`). */
  getChildren: async (): Promise<FamilyChild[]> => {
    const rows = await familyGet<any>('fees');
    return rows.map((r) => ({
      id: r.studentId,
      name: r.student?.name ?? '',
      classId: r.student?.classId ?? null,
      admissionNo: r.student?.admissionNo ?? null,
      rollNo: r.student?.rollNo ?? null,
    }));
  },

  getAttendance: (studentId: string, month: number, year: number) =>
    forStudent<any>('attendance', studentId, { month, year }),

  getTimetable: (studentId: string) => forStudent<any>('timetable', studentId),

  getHomework: async (studentId: string) => {
    const row = await forStudent<any>('homework', studentId);
    return (row?.assignments ?? []) as any[];
  },

  getResults: async (studentId: string) => {
    const row = await forStudent<any>('exam-results', studentId);
    return (row?.results ?? []) as any[];
  },

  getFees: (studentId: string) => forStudent<any>('fees', studentId),

  getPayments: async (studentId: string) => {
    const row = await forStudent<any>('fees/payments', studentId);
    return (row?.payments ?? []) as any[];
  },

  initiatePayment: async (studentId: string, amount?: number) => {
    const res = await api.post('/family/fees/initiate', {
      studentId,
      ...(amount ? { amount } : {}),
    });
    return unwrap<any>(res);
  },

  verifyPayment: async (payload: { orderId: string; paymentId: string; signature: string }) => {
    const res = await api.post('/family/fees/verify', payload);
    return unwrap<any>(res);
  },

  // ── Homework submission (student) ─────────────────────────────
  submitHomework: async (
    assignmentId: string,
    studentId: string,
    notes: string,
    file?: File | null
  ) => {
    if (file) {
      const form = new FormData();
      form.append('studentId', studentId);
      if (notes) form.append('notes', notes);
      form.append('file', file, file.name);
      const res = await api.post(`/homework/${assignmentId}/upload-submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return unwrap<any>(res);
    }
    const res = await api.post(`/homework/${assignmentId}/submit`, {
      studentId,
      ...(notes ? { notes } : {}),
    });
    return unwrap<any>(res);
  },

  // ── Transport (parent) ────────────────────────────────────────
  getTransport: async (studentId: string) => {
    const res = await api.get(`/transport/students/${studentId}`);
    return (unwrap<any>(res) ?? null) as any | null;
  },

  getVehicleLocation: async (vehicleId: string) => {
    try {
      const res = await api.get(`/transport/vehicles/${vehicleId}/location`, {
        skipAuthRedirect: true,
      });
      return unwrap<any>(res) as any;
    } catch (err: any) {
      // 404 = the vehicle has not reported a position yet — not an error state.
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  // ── Library ───────────────────────────────────────────────────
  getLibraryIssues: async (studentId: string) => {
    const res = await api.get(`/library/issues/member/${studentId}`);
    return asList<any>(unwrap(res));
  },

  // ── Online classes & quizzes (student) ────────────────────────
  getOnlineClasses: async (classId: string) => {
    const res = await api.get('/academics/online-classes', { params: { classId, limit: 50 } });
    return asList<any>(unwrap(res));
  },

  getQuizzes: async (classId: string) => {
    const res = await api.get('/academics/quizzes', { params: { classId } });
    return asList<any>(unwrap(res));
  },

  getQuizQuestions: async (quizId: string) => {
    const res = await api.get(`/academics/quizzes/${quizId}/questions`);
    return asList<any>(unwrap(res));
  },

  startQuizAttempt: async (quizId: string, studentId: string) => {
    const res = await api.post(`/academics/quizzes/${quizId}/attempts`, { studentId });
    return unwrap<any>(res);
  },

  submitQuizAttempt: async (quizId: string, studentId: string, answers: Record<string, any>) => {
    const res = await api.post(`/academics/quizzes/${quizId}/attempts/submit`, {
      studentId,
      answers,
    });
    return unwrap<any>(res);
  },

  // ── School notices (dashboard) ────────────────────────────────
  getAnnouncements: async (targetRole: string, limit = 5) => {
    const res = await api.get('/communication/announcements', {
      params: { page: 1, limit, targetRole },
    });
    return asList<any>(unwrap(res));
  },

  getEvents: async () => {
    const res = await api.get('/communication/events');
    return asList<any>(unwrap(res));
  },
};
