import api from "@/lib/api/axios";
import { useLicense } from "@/contexts/LicenseContext";
import toast from "react-hot-toast";

export const useLicenses = () => {
  const { setLicenses, setMeta, setLoading } = useLicense();

  const getLicenses = async (
    page = 1,
    limit = 10,
    search?: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const response = await api.get(`licenses?${params.toString()}`);
      if (response.status === 200) {
        setLicenses(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch licenses");
    } finally {
      setLoading(false);
    }
  };

  const getLicense = async (id: string) => {
    try {
      const response = await api.get(`licenses/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch license"
      );
      return null;
    }
  };

  const createLicense = async (data: any) => {
    try {
      const response = await api.post("licenses", data);
      if (response.status === 201) {
        toast.success("License created successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create license"
      );
      return null;
    }
  };

  const updateLicense = async (id: string, data: any) => {
    try {
      const response = await api.patch(`licenses/${id}`, data);
      if (response.status === 200) {
        toast.success("License updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update license"
      );
      return null;
    }
  };

  const deleteLicense = async (id: string) => {
    try {
      const response = await api.delete(`licenses/${id}`);
      if (response.status === 200) {
        toast.success("License deleted successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete license"
      );
      return false;
    }
  };

  return {
    getLicenses,
    getLicense,
    createLicense,
    updateLicense,
    deleteLicense,
  };
};
