import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type TenderType =
  | "TENDER"
  | "CONSULTING"
  | "AUCTION"
  | "NOTICE"
  | "ANNOUNCEMENT"
  | "OTHER";

export type TenderSector =
  | "MINING"
  | "OIL"
  | "GAS"
  | "CONSULTING"
  | "OTHER";

export type TenderStatus = "OPEN" | "CLOSED";

export type TenderLanguage = "EN" | "PS" | "FA";

export type TenderTag = {
  id: number;
  tenderId: string;
  tag: string;
};

export type TenderActivity = {
  id: number;
  tenderId: string;
  action: "VIEWED" | "APPLIED" | "IGNORED" | "ASSIGNED" | "NOTIFIED";
  userId: number | null;
  notes: string | null;
  createdAt: string;
};

export type Tender = {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  referenceNo: string | null;
  publishDate: string | null;
  closingDate: string | null;
  sector: TenderSector;
  type: TenderType;
  status: TenderStatus;
  language: TenderLanguage;
  projectName: string | null;
  location: string | null;
  attachments: any[] | null;
  priorityScore: number | null;
  organizationId: number | null;
  createdAt: string;
  updatedAt: string;
  tags?: TenderTag[];
  organization?: { id: number; name: string; country: string | null } | null;
  activities?: TenderActivity[];
};

export type TenderMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TenderFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenderStatus;
  sector?: TenderSector;
  type?: TenderType;
  language?: TenderLanguage;
  closingFrom?: string;
  closingTo?: string;
  closingWithinDays?: number;
};

export type TenderListResponse = {
  data: Tender[];
  meta: TenderMeta;
};

export const useTenders = () => {
  const buildParams = (filters: TenderFilters) => {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.sector) params.append("sector", filters.sector);
    if (filters.type) params.append("type", filters.type);
    if (filters.language) params.append("language", filters.language);
    if (filters.closingFrom) params.append("closingFrom", filters.closingFrom);
    if (filters.closingTo) params.append("closingTo", filters.closingTo);
    if (filters.closingWithinDays !== undefined)
      params.append("closingWithinDays", String(filters.closingWithinDays));
    return params;
  };

  const getTenders = async (
    filters: TenderFilters = {}
  ): Promise<TenderListResponse> => {
    try {
      const params = buildParams(filters);
      const response = await api.get(`tenders?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch tenders"
      );
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const getTender = async (id: string): Promise<Tender | null> => {
    try {
      const response = await api.get(`tenders/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch tender");
      return null;
    }
  };

  const createTender = async (data: any): Promise<Tender | null> => {
    try {
      const response = await api.post("tenders", data);
      toast.success("Tender created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create tender");
      return null;
    }
  };

  const updateTender = async (
    id: string,
    data: any
  ): Promise<Tender | null> => {
    try {
      const response = await api.patch(`tenders/${id}`, data);
      toast.success("Tender updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update tender");
      return null;
    }
  };

  const deleteTender = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`tenders/${id}`);
      toast.success("Tender deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete tender");
      return false;
    }
  };

  const logActivity = async (
    id: string,
    action: TenderActivity["action"],
    notes?: string
  ) => {
    try {
      const response = await api.post(`tenders/${id}/activity`, {
        action,
        notes,
      });
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to log activity");
      return null;
    }
  };

  // -------------- REPORTS --------------

  const getReportSummary = async () => {
    try {
      const response = await api.get("tenders/reports/summary");
      return response.data;
    } catch {
      return null;
    }
  };

  const getReportStatus = async () => {
    try {
      const response = await api.get("tenders/reports/status");
      return response.data;
    } catch {
      return [];
    }
  };

  const getReportSector = async () => {
    try {
      const response = await api.get("tenders/reports/sector");
      return response.data;
    } catch {
      return [];
    }
  };

  const getReportType = async () => {
    try {
      const response = await api.get("tenders/reports/type");
      return response.data;
    } catch {
      return [];
    }
  };

  const getReportMonthly = async () => {
    try {
      const response = await api.get("tenders/reports/monthly");
      return response.data;
    } catch {
      return [];
    }
  };

  const getClosingSoon = async (days = 7) => {
    try {
      const response = await api.get(`tenders/reports/closing-soon?days=${days}`);
      return response.data;
    } catch {
      return [];
    }
  };

  // -------------- EXPORT --------------

  const exportTenders = async (
    filters: TenderFilters = {},
    format: "pdf" | "excel" | "csv" = "excel"
  ) => {
    try {
      const params = buildParams(filters);
      params.append("format", format);

      const response = await api.get(`tenders/export?${params.toString()}`, {
        responseType: "blob",
      });

      // Determine filename from Content-Disposition or fallback
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `tenders-report.${
        format === "excel" ? "xlsx" : format
      }`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match) fileName = match[1];
      }

      // Trigger browser download
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Export downloaded successfully");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to export tenders"
      );
      return false;
    }
  };

  return {
    getTenders,
    getTender,
    createTender,
    updateTender,
    deleteTender,
    logActivity,
    getReportSummary,
    getReportStatus,
    getReportSector,
    getReportType,
    getReportMonthly,
    getClosingSoon,
    exportTenders,
  };
};
