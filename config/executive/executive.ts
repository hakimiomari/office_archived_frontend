import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type KpiCategory =
  | "FINANCIAL"
  | "CONTRACT"
  | "TRAVEL"
  | "OPERATIONAL"
  | "OTHER";

export type TravelType = "DOMESTIC" | "INTERNATIONAL";

export type Kpi = {
  id: number;
  key: string;
  value: number;
  year: number;
  category: KpiCategory;
  label: string | null;
  description: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractsSummary = {
  id: number;
  year: number;
  totalContracts: number;
  activeContracts: number;
  suspendedContracts: number;
  cancelledContracts: number;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MinisterTravel = {
  id: number;
  type: TravelType;
  destination: string;
  purpose: string | null;
  startDate: string;
  endDate: string | null;
  cost: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardData = {
  year: number;
  financial: {
    totalRevenue: number | null;
    totalExpenses: number | null;
    netProfit: number | null;
  };
  contracts: ContractsSummary;
  travel: {
    total: number;
    domestic: number;
    international: number;
    totalCost: number;
  };
  recentTravels: MinisterTravel[];
  contractsYearlyTrend: ContractsSummary[];
  kpis: Kpi[];
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useExecutive = () => {
  // --- Dashboard ---
  const getDashboard = async (year?: number): Promise<DashboardData | null> => {
    try {
      const response = await api.get(
        `executive/dashboard${year ? `?year=${year}` : ""}`,
      );
      return response.data;
    } catch {
      return null;
    }
  };

  const getRevenueTrend = async (): Promise<
    { year: number; revenue: number; expenses: number }[]
  > => {
    try {
      const response = await api.get("executive/dashboard/revenue-trend");
      return response.data;
    } catch {
      return [];
    }
  };

  // --- KPIs ---
  const getKpis = async (filters: { year?: number; category?: KpiCategory } = {}): Promise<Kpi[]> => {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", String(filters.year));
      if (filters.category) params.append("category", filters.category);
      const response = await api.get(`executive/kpis?${params.toString()}`);
      return response.data;
    } catch {
      return [];
    }
  };

  const upsertKpi = async (data: Partial<Kpi>): Promise<Kpi | null> => {
    try {
      const response = await api.post("executive/kpis/upsert", data);
      toast.success("KPI saved successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save KPI");
      return null;
    }
  };

  const deleteKpi = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`executive/kpis/${id}`);
      toast.success("KPI deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete KPI");
      return false;
    }
  };

  // --- Contracts Summary ---
  const getContractsSummaries = async (): Promise<ContractsSummary[]> => {
    try {
      const response = await api.get("executive/contracts-summary");
      return response.data;
    } catch {
      return [];
    }
  };

  const upsertContractsSummary = async (
    data: Partial<ContractsSummary>,
  ): Promise<ContractsSummary | null> => {
    try {
      const response = await api.post("executive/contracts-summary", data);
      toast.success("Contracts summary saved successfully");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save contracts summary",
      );
      return null;
    }
  };

  const deleteContractsSummary = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`executive/contracts-summary/${id}`);
      toast.success("Contracts summary deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete contracts summary",
      );
      return false;
    }
  };

  // --- Travels ---
  const getTravels = async (
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      type?: TravelType;
      year?: number;
    } = {},
  ): Promise<{ data: MinisterTravel[]; meta: Meta }> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`executive/travels?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const createTravel = async (
    data: Partial<MinisterTravel>,
  ): Promise<MinisterTravel | null> => {
    try {
      const response = await api.post("executive/travels", data);
      toast.success("Travel recorded successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save travel");
      return null;
    }
  };

  const updateTravel = async (
    id: number,
    data: Partial<MinisterTravel>,
  ): Promise<MinisterTravel | null> => {
    try {
      const response = await api.patch(`executive/travels/${id}`, data);
      toast.success("Travel updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update travel");
      return null;
    }
  };

  const deleteTravel = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`executive/travels/${id}`);
      toast.success("Travel deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete travel");
      return false;
    }
  };

  return {
    getDashboard,
    getRevenueTrend,
    getKpis,
    upsertKpi,
    deleteKpi,
    getContractsSummaries,
    upsertContractsSummary,
    deleteContractsSummary,
    getTravels,
    createTravel,
    updateTravel,
    deleteTravel,
  };
};
