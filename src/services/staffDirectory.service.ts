import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface StaffDirectoryEntry {
  id: string;
  name: string;
  designation: string | null;
  departmentId: string | null;
}

export const staffService = {
  /** GET /staff/directory-lite — picker data readable by every staff role. */
  getDirectoryLite: async (): Promise<StaffDirectoryEntry[]> => {
    const res = await api.get('/staff/directory-lite');
    return asList<StaffDirectoryEntry>(unwrap(res));
  },
};

export const staffDirectoryService = staffService;
