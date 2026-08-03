import { api } from './api';

/**
 * Student documents — admit cards, ID cards and marksheets.
 *
 * Four endpoints that had no UI on either client, so a school could not issue
 * any of the paperwork the module was built to produce. The generators return
 * a structured payload (school header, student block, exam schedule / marks
 * table) rather than a PDF, so the client renders and prints it.
 */

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? null;

export const documentsService = {
  list: async (studentId: string) => {
    const res = await api.get(`/documents/student/${studentId}`);
    const d = unwrap(res);
    return d?.items ?? d ?? [];
  },

  generateAdmitCard: async (studentId: string, examId: string) => {
    const res = await api.post(`/documents/student/${studentId}/admit-card/${examId}`, {});
    return unwrap(res);
  },

  generateIdCard: async (studentId: string) => {
    const res = await api.post(`/documents/student/${studentId}/id-card`, {});
    return unwrap(res);
  },

  generateMarksheet: async (studentId: string, examId: string) => {
    const res = await api.post(`/documents/student/${studentId}/marksheet/${examId}`, {});
    return unwrap(res);
  },
};
