import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import type { ListResponse } from "@/config/inventory/inventory";

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

export const useCompanies = () => {
  const list = async (filters: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ListResponse<Company>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "")
          params.append(k, String(v));
      });
      const r = await api.get(`admin/companies?${params.toString()}`);
      return r.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }
  };

  const get = async (id: number): Promise<Company | null> => {
    try {
      const r = await api.get(`admin/companies/${id}`);
      return r.data;
    } catch {
      return null;
    }
  };

  const create = async (data: {
    name: string;
    slug?: string;
    timezone?: string;
    notes?: string;
    isActive?: boolean;
  }): Promise<Company | null> => {
    try {
      const r = await api.post("admin/companies", data);
      toast.success("Company created");
      return r.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create");
      return null;
    }
  };

  const update = async (
    id: number,
    data: Partial<Company>,
  ): Promise<Company | null> => {
    try {
      const r = await api.patch(`admin/companies/${id}`, data);
      toast.success("Company updated");
      return r.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update");
      return null;
    }
  };

  const setActive = async (id: number, isActive: boolean): Promise<boolean> => {
    try {
      await api.patch(`admin/companies/${id}/active`, { isActive });
      toast.success(isActive ? "Company activated" : "Company deactivated");
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
      return false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`admin/companies/${id}`);
      toast.success("Company deleted");
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete");
      return false;
    }
  };

  const stats = async (): Promise<AdminStats | null> => {
    try {
      const r = await api.get("admin/companies/stats");
      return r.data;
    } catch {
      return null;
    }
  };

  return { list, get, create, update, setActive, remove, stats };
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
