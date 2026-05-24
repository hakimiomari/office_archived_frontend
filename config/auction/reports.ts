import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import { AuctionType } from "@/contexts/LicenseContext";

export type AuctionReportFilters = {
  from?: string;
  to?: string;
  mineralTypeId?: string;
  provinceId?: number;
  priceCurrency?: "AFN" | "USD";
  page?: number;
  limit?: number;
};

export type AuctionReportMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuctionReportAggregations = {
  totalAuctions: number;
  totalsByCurrency: { currency: string; total: number }[];
  royaltyByCurrency: { currency: string; royalty: number }[];
};

export type AuctionChartData = {
  byMineral: { mineral: string; count: number }[];
  byProvince: { province: string; count: number }[];
  byCurrency: { currency: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  yearlyTrend: { year: string; count: number }[];
};

const buildParams = (f: AuctionReportFilters): string => {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) {
      p.append(k, String(v));
    }
  });
  return p.toString();
};

export const useAuctionReports = () => {
  const getAuctionReport = async (
    filters: AuctionReportFilters = {}
  ): Promise<{
    data: AuctionType[];
    meta: AuctionReportMeta | null;
    aggregations: AuctionReportAggregations | null;
  }> => {
    try {
      const res = await api.get(`reports/auctions?${buildParams(filters)}`);
      return {
        data: res.data.data ?? [],
        meta: res.data.meta ?? null,
        aggregations: res.data.aggregations ?? null,
      };
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch auction report"
      );
      return { data: [], meta: null, aggregations: null };
    }
  };

  const getAuctionChartData = async (
    filters: AuctionReportFilters = {}
  ): Promise<AuctionChartData | null> => {
    try {
      const res = await api.get(
        `reports/auctions/charts?${buildParams(filters)}`
      );
      return res.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch chart data"
      );
      return null;
    }
  };

  const exportAuctionReport = async (
    filters: AuctionReportFilters = {},
    type: "pdf" | "excel" | "csv" = "excel"
  ) => {
    try {
      const params = new URLSearchParams(buildParams(filters));
      params.append("type", type);

      const res = await api.get(
        `reports/auctions/export?${params.toString()}`,
        { responseType: "blob" }
      );

      const contentDisposition = res.headers["content-disposition"];
      let fileName = `auctions-report.${type === "excel" ? "xlsx" : type}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Auction report exported as ${type.toUpperCase()}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to export auction report"
      );
    }
  };

  return { getAuctionReport, getAuctionChartData, exportAuctionReport };
};
