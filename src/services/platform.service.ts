import { api } from './api';

/**
 * Platform/integration surfaces: API keys, webhooks and server observability.
 *
 * All three were implemented server-side with no UI, so integrations could not
 * be set up from the product and the superadmin had no way to see server health
 * or read logs without SSH.
 */

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? null;
const asList = (d: any) => d?.items ?? d ?? [];

export interface ApiKeySummary {
  id?: string;
  name: string;
  prefix: string;
  scopes?: string[];
  expiresAt?: string | null;
  createdAt?: string;
  revoked?: boolean;
}

export interface WebhookSummary {
  id: string;
  url: string;
  events: string[];
  isActive?: boolean;
  createdAt?: string;
}

export const apiKeyService = {
  list: async (): Promise<ApiKeySummary[]> => asList(unwrap(await api.get('/api-keys'))),

  /** The full key comes back exactly once — the server stores only a hash. */
  create: async (body: { name: string; scopes?: string[]; expiresInDays?: number }) =>
    unwrap(await api.post('/api-keys', body)),

  revoke: async (prefix: string) => unwrap(await api.delete(`/api-keys/${prefix}`)),
};

export const webhookService = {
  list: async (): Promise<WebhookSummary[]> => asList(unwrap(await api.get('/webhooks'))),

  listEvents: async (): Promise<string[]> => asList(unwrap(await api.get('/webhooks/events'))),

  register: async (body: { url: string; events: string[] }) =>
    unwrap(await api.post('/webhooks', body)),

  deactivate: async (id: string) => unwrap(await api.delete(`/webhooks/${id}`)),
};

export const observabilityService = {
  metrics: async () => unwrap(await api.get('/admin/metrics')),

  logs: async (params: { date?: string; level?: string; search?: string; lines?: number; page?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && v !== '' && q.append(k, String(v)));
    return unwrap(await api.get(`/admin/logs?${q}`));
  },

  logFiles: async () => asList(unwrap(await api.get('/admin/logs/files'))),
};
