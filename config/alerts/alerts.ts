import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import type { ListResponse } from "@/config/inventory/inventory";

export type AlertType = "LOW_STOCK" | "OVERSTOCK" | "DEAD_STOCK" | "REORDER";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type Alert = {
  id: number;
  type: AlertType;
  status: AlertStatus;
  itemId: number;
  warehouseId: number | null;
  message: string;
  threshold: number | null;
  currentValue: number | null;
  metadata: unknown;
  createdAt: string;
  resolvedAt: string | null;
  item: { id: number; name: string; sku: string | null };
  warehouse: { id: number; name: string } | null;
};

export const useAlerts = () => {
  const list = async (filters: {
    page?: number;
    limit?: number;
    type?: AlertType;
    status?: AlertStatus;
    itemId?: number;
    warehouseId?: number;
  } = {}): Promise<ListResponse<Alert>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") params.append(k, String(v));
      });
      const response = await api.get(`alerts?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }
  };

  const scan = async (): Promise<{ scanned: number; opened: number; resolved: number } | null> => {
    try {
      const response = await api.post("alerts/scan");
      toast.success(`Scan: ${response.data.opened} opened, ${response.data.resolved} resolved`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Scan failed");
      return null;
    }
  };

  const scanDeadStock = async (days = 90): Promise<number> => {
    try {
      const response = await api.post("alerts/scan-dead-stock", { days });
      toast.success(`Dead-stock scan: ${response.data} new alerts`);
      return response.data ?? 0;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Dead-stock scan failed");
      return 0;
    }
  };

  const dispatch = async (): Promise<number> => {
    try {
      const response = await api.post("alerts/dispatch");
      toast.success(`Dispatched ${response.data.dispatched} alerts`);
      return response.data.dispatched ?? 0;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Dispatch failed");
      return 0;
    }
  };

  const acknowledge = async (id: number): Promise<boolean> => {
    try {
      await api.post(`alerts/${id}/acknowledge`);
      toast.success("Alert acknowledged");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to acknowledge");
      return false;
    }
  };

  const resolve = async (id: number): Promise<boolean> => {
    try {
      await api.post(`alerts/${id}/resolve`);
      toast.success("Alert resolved");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resolve");
      return false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`alerts/${id}`);
      toast.success("Alert deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
      return false;
    }
  };

  return { list, scan, scanDeadStock, dispatch, acknowledge, resolve, remove };
};
