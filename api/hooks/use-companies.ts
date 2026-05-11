"use client";

/**
 * Companies hook — wraps the pure service with toast handling so existing
 * pages get a familiar `useCompanies()` shape with a single call.
 *
 * The shape intentionally matches the legacy `useCompanies` in
 * `config/companies/companies.ts` so pages can migrate by changing the
 * import path only. The behavior is the same except that on failure the
 * hook returns a defensive default (empty list, null, false) AFTER
 * surfacing a toast — same as before.
 *
 * When we eventually wire React Query, this file becomes the place where
 * `useQuery` / `useMutation` live. The page code stays unchanged.
 */
import toast from "react-hot-toast";
import {
  AdminStats,
  Company,
  CompanyCreateInput,
  CompanyListResponse,
  createCompany,
  deleteCompany,
  getAdminStats,
  getCompany,
  listCompanies,
  setCompanyActive,
  updateCompany,
} from "../services/companies.service";

// Re-export types so consumers can import everything from the hook.
export type { Company, CompanyListResponse, CompanyCreateInput, AdminStats };

const EMPTY_LIST: CompanyListResponse = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

function toastError(err: any, fallback: string) {
  toast.error(err?.response?.data?.message || fallback);
}

/**
 * Notify the rest of the app that the company list changed (create /
 * update / activate / delete). The CompanySwitcher in the sidebar
 * listens for this event and re-fetches, so a SUPER_ADMIN editing a
 * company on `/dashboard/companies` sees the dropdown update without
 * a full page reload. Future mutation sites get this for free.
 */
export const COMPANIES_CHANGED_EVENT = "companies:changed";

function emitCompaniesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COMPANIES_CHANGED_EVENT));
}

export const useCompanies = () => {
  const list = async (
    filters: { page?: number; limit?: number; search?: string } = {},
  ): Promise<CompanyListResponse> => {
    try {
      return await listCompanies(filters);
    } catch {
      // List endpoints intentionally swallow errors so the calling page
      // can re-render gracefully on transient failures (e.g. brief 401
      // while the refresh-token interceptor rotates). Other endpoints
      // surface the error.
      return EMPTY_LIST;
    }
  };

  const get = async (id: number): Promise<Company | null> => {
    try {
      return await getCompany(id);
    } catch {
      return null;
    }
  };

  const create = async (
    data: CompanyCreateInput,
  ): Promise<Company | null> => {
    try {
      const result = await createCompany(data);
      toast.success("Company created");
      emitCompaniesChanged();
      return result;
    } catch (e) {
      toastError(e, "Failed to create");
      return null;
    }
  };

  const update = async (
    id: number,
    data: Partial<Company>,
  ): Promise<Company | null> => {
    try {
      const result = await updateCompany(id, data);
      toast.success("Company updated");
      emitCompaniesChanged();
      return result;
    } catch (e) {
      toastError(e, "Failed to update");
      return null;
    }
  };

  const setActive = async (
    id: number,
    isActive: boolean,
  ): Promise<boolean> => {
    try {
      await setCompanyActive(id, isActive);
      toast.success(isActive ? "Company activated" : "Company deactivated");
      emitCompaniesChanged();
      return true;
    } catch (e) {
      toastError(e, "Failed");
      return false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    try {
      await deleteCompany(id);
      toast.success("Company deleted");
      emitCompaniesChanged();
      return true;
    } catch (e) {
      toastError(e, "Failed to delete");
      return false;
    }
  };

  const stats = async (): Promise<AdminStats | null> => {
    try {
      return await getAdminStats();
    } catch {
      return null;
    }
  };

  return { list, get, create, update, setActive, remove, stats };
};
