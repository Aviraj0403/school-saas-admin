import { api } from './api';

/**
 * Staff attendance and biometric device provisioning.
 *
 * Both modules were fully implemented server-side and had no UI at all. The
 * attendance screen's "Biometric Sync & Telemetry" tab rendered hardcoded
 * terminals (BIO-01-MAIN, 192.168.1.120, a pulsing ONLINE dot) with no network
 * call behind it, while the real devices endpoint went unused.
 */

export type StaffAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';

export interface StaffAttendanceRow {
  id?: string;
  staffId: string;
  staffName?: string;
  status: StaffAttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  note?: string | null;
}

export interface BiometricDevice {
  id: string;
  deviceId: string;
  name?: string | null;
  location?: string | null;
  isActive: boolean;
  lastSeenAt?: string | null;
  lastIp?: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'REVOKED';
}

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? null;

export const staffAttendanceService = {
  /** Register for a date, optionally narrowed to one department. */
  getByDate: async (date: string, departmentId?: string): Promise<StaffAttendanceRow[]> => {
    const params = new URLSearchParams({ date });
    if (departmentId) params.append('departmentId', departmentId);
    const res = await api.get(`/attendance/staff/date?${params}`);
    const d = unwrap(res);
    return d?.items ?? d ?? [];
  },

  markBulk: async (date: string, records: Array<{ staffId: string; status: StaffAttendanceStatus; note?: string }>) => {
    const res = await api.post('/attendance/staff/bulk', { date, records });
    return unwrap(res);
  },

  markSingle: async (body: { staffId: string; date: string; status: StaffAttendanceStatus; note?: string }) => {
    const res = await api.post('/attendance/staff/single', body);
    return unwrap(res);
  },

  /** Monthly summary for one employee — own record unless admin. */
  getSummary: async (staffId: string, month: number, year: number) => {
    const res = await api.get(`/attendance/staff/${staffId}/summary?month=${month}&year=${year}`);
    return unwrap(res);
  },
};

export const biometricService = {
  getDevices: async (): Promise<BiometricDevice[]> => {
    const res = await api.get('/attendance/biometric/devices');
    const d = unwrap(res);
    return d?.items ?? d ?? [];
  },

  /**
   * Provisioning returns the device key exactly once — the server stores only a
   * hash, so it can never be shown again. The caller must surface it there and
   * then.
   */
  provisionDevice: async (body: { deviceId: string; name?: string; location?: string }) => {
    const res = await api.post('/attendance/biometric/devices', body);
    return unwrap(res);
  },

  revokeDevice: async (id: string) => {
    const res = await api.patch(`/attendance/biometric/devices/${id}/revoke`);
    return unwrap(res);
  },
};
