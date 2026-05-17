import api from "@/lib/api/axios";
import { useLicense } from "@/contexts/LicenseContext";
import toast from "react-hot-toast";

export type ReportFilters = {
  from?: string;
  to?: string;
  licenseType?:
    | "TRADE"
    | "IMPORT"
    | "EXPORT"
    | "INDUSTRIAL"
    | "PROFESSIONAL";
  status?: "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" | "CANCELLED";
  province?: string;
  page?: number;
  limit?: number;
};

export const useReports = () => {
  const { setLicenses, setMeta, setAggregations, setLoading } = useLicense();

  const getLicenseReport = async (filters: ReportFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });

      const response = await api.get(
        `reports/licenses?${params.toString()}`
      );
      if (response.status === 200) {
        setLicenses(response.data.data);
        setMeta(response.data.meta);
        setAggregations(response.data.aggregations);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (
    filters: ReportFilters = {},
    type: "pdf" | "excel" | "csv" = "excel"
  ) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
      params.append("type", type);

      const response = await api.get(
        `reports/licenses/export?${params.toString()}`,
        { responseType: "blob" }
      );

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `licenses-report.${type === "excel" ? "xlsx" : type}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${type.toUpperCase()}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to export report"
      );
    }
  };

  const getChartData = async (filters: ReportFilters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });

      const response = await api.get(
        `reports/licenses/charts?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch chart data"
      );
      return null;
    }
  };

  return { getLicenseReport, exportReport, getChartData };
};
