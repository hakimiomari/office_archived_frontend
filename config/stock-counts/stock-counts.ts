import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import type { Item, Warehouse, ListResponse } from "@/config/inventory/inventory";

export type StockCountStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type StockCountLine = {
  id: number;
  stockCountId: number;
  itemId: number;
  expectedQty: number;
  countedQty: number;
  variance: number;
  notes: string | null;
  item?: Item;
};

export type StockCount = {
  id: number;
  reference: string | null;
  warehouseId: number;
  status: StockCountStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
  lines?: StockCountLine[];
  _count?: { lines: number };
};

export type VarianceRow = {
  itemId: number;
  name: string;
  countCount: number;
  totalVariance: number;
  absVariance: number;
};

export const useStockCounts = () => {
  const list = async (filters: {
    page?: number;
    limit?: number;
    status?: StockCountStatus;
    warehouseId?: number;
  } = {}): Promise<ListResponse<StockCount>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") params.append(k, String(v));
      });
      const response = await api.get(`stock-counts?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const get = async (id: number): Promise<StockCount | null> => {
    try {
      const response = await api.get(`stock-counts/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const create = async (data: {
    warehouseId: number;
    reference?: string;
    notes?: string;
    itemIds?: number[];
  }): Promise<StockCount | null> => {
    try {
      const response = await api.post("stock-counts", data);
      toast.success("Stock count opened");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to open stock count");
      return null;
    }
  };

  const submit = async (
    id: number,
    lines: { itemId: number; countedQty: number; notes?: string }[],
  ): Promise<StockCount | null> => {
    try {
      const response = await api.post(`stock-counts/${id}/submit`, { lines });
      toast.success("Counts saved");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save counts");
      return null;
    }
  };

  const complete = async (
    id: number,
    applyAdjustments = true,
  ): Promise<StockCount | null> => {
    try {
      const response = await api.post(`stock-counts/${id}/complete`, {
        applyAdjustments,
      });
      toast.success("Stock count completed");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to complete count");
      return null;
    }
  };

  const cancel = async (id: number): Promise<boolean> => {
    try {
      await api.post(`stock-counts/${id}/cancel`);
      toast.success("Stock count cancelled");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel");
      return false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`stock-counts/${id}`);
      toast.success("Stock count deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
      return false;
    }
  };

  const variance = async (days = 90): Promise<VarianceRow[]> => {
    try {
      const response = await api.get(`stock-counts/reports/variance?days=${days}`);
      return response.data;
    } catch {
      return [];
    }
  };

  return { list, get, create, submit, complete, cancel, remove, variance };
};
