import { api } from '@/services/api';
import { unwrap, asList } from '@/lib/utils';

export type ModuleSource = 'core' | 'override' | 'addon' | 'plan' | 'off';
export type AddonMode = 'paid' | 'free' | 'trial';

export interface SchoolModuleAddon {
  key: string;
  mode: AddonMode;
  priceMonthly: number | null;
  endsAt: string | null;
  note: string | null;
}

export interface SchoolModuleRow {
  key: string;
  label: string;
  description: string;
  group: string;
  core: boolean;
  tier?: string;
  priceMonthly: number | null;
  plan: boolean;
  override: boolean | null;
  addon: SchoolModuleAddon | null;
  addonExpired: boolean;
  effective: boolean;
  source: ModuleSource;
}

export interface SchoolModuleDetail {
  plan: { id: string; name: string; slug: string } | null;
  modules: SchoolModuleRow[];
}

export interface CatalogRow {
  key: string;
  label: string;
  description: string;
  group: string;
  core?: boolean;
  tier?: string;
  priceMonthly: number | null;
  schools: number;
  totalSchools: number;
}

export interface AddonInput {
  mode: AddonMode | 'off';
  priceMonthly?: number;
  endsAt?: string;
  note?: string;
}

export const subscriptionModulesService = {
  schoolModules: async (tenantId: string): Promise<SchoolModuleDetail> =>
    unwrap(await api.get(`/superadmin/schools/${tenantId}/modules`)),

  setOverride: async (
    tenantId: string,
    key: string,
    value: boolean | null
  ): Promise<SchoolModuleDetail> =>
    unwrap(await api.put(`/superadmin/schools/${tenantId}/modules/${key}`, { value })),

  setAddon: async (tenantId: string, key: string, body: AddonInput): Promise<SchoolModuleDetail> =>
    unwrap(await api.put(`/superadmin/schools/${tenantId}/addons/${key}`, body)),

  catalog: async (): Promise<CatalogRow[]> =>
    asList<CatalogRow>(unwrap(await api.get('/superadmin/modules/catalog'))),

  updateCatalog: async (
    key: string,
    body: { label?: string; description?: string; priceMonthly?: number | null }
  ): Promise<CatalogRow[]> =>
    asList<CatalogRow>(unwrap(await api.patch(`/superadmin/modules/catalog/${key}`, body))),
};
