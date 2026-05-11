/**
 * Companies (tenant management) — pure request functions.
 *
 * Conventions for every `services/<resource>.service.ts`:
 *
 *  - **No React.** No hooks, no toast, no state. Just async functions
 *    that return JSON or throw.
 *  - **Throw on error.** Let the hook layer decide whether to swallow,
 *    toast, retry, or rethrow. Service code itself catches nothing.
 *  - **Types exported here.** The pure types belong with the service.
 *    Hooks re-export them so consumers don't have to import from two
 *    places.
 *  - **No `companyId` in payloads.** The backend tenant extension
 *    injects it. (For SUPER_ADMINs, the picker writes the
 *    `X-Tenant-Company-Id` header automatically.)
 */
import { api } from "../client";

export type Company = {
  id: number;
  name: string;
  slug: string | null;
  isActive: boolean;
  timezone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users?: number;
    items?: number;
    warehouses?: number;
    sales?: number;
    customers?: number;
    employees?: number;
    purchases?: number;
  };
};

export type CompanyListResponse = {
  data: Company[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type CompanyCreateInput = {
  name: string;
  slug?: string;
  timezone?: string;
  notes?: string;
  isActive?: boolean;
};

export type AdminStats = {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalItems: number;
  totalWarehouses: number;
  totalSales: number;
  totalRevenue: number;
  totalPurchases: number;
  recentCompanies: {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    _count: { users: number; items: number; sales: number };
  }[];
};

function buildParams(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") {
      params.append(k, String(v));
    }
  });
  return params.toString();
}

export async function listCompanies(
  filters: { page?: number; limit?: number; search?: string } = {},
): Promise<CompanyListResponse> {
  const qs = buildParams(filters);
  const r = await api.get(`admin/companies?${qs}`);
  return r.data;
}

export async function getCompany(id: number): Promise<Company> {
  const r = await api.get(`admin/companies/${id}`);
  return r.data;
}

export async function createCompany(
  data: CompanyCreateInput,
): Promise<Company> {
  const r = await api.post("admin/companies", data);
  return r.data;
}

export async function updateCompany(
  id: number,
  data: Partial<Company>,
): Promise<Company> {
  const r = await api.patch(`admin/companies/${id}`, data);
  return r.data;
}

export async function setCompanyActive(
  id: number,
  isActive: boolean,
): Promise<void> {
  await api.patch(`admin/companies/${id}/active`, { isActive });
}

export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`admin/companies/${id}`);
}

export async function getAdminStats(): Promise<AdminStats> {
  const r = await api.get("admin/companies/stats");
  return r.data;
}
