import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import { MineralType } from "@/contexts/LicenseContext";

export type MineralMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useMineralTypes = () => {
  const getMineralTypes = async (
    page = 1,
    limit = 100,
    search?: string
  ): Promise<{ data: MineralType[]; meta: MineralMeta | null }> => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const response = await api.get(`mineral-types?${params.toString()}`);
      return { data: response.data.data, meta: response.data.meta };
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch mineral types"
      );
      return { data: [], meta: null };
    }
  };

  const createMineralType = async (data: {
    name: string;
    mineralCategory?: string;
  }) => {
    try {
      const response = await api.post("mineral-types", data);
      if (response.status === 201) {
        toast.success("Mineral type created successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create mineral type"
      );
      return null;
    }
  };

  const updateMineralType = async (id: string, data: any) => {
    try {
      const response = await api.patch(`mineral-types/${id}`, data);
      if (response.status === 200) {
        toast.success("Mineral type updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update mineral type"
      );
      return null;
    }
  };

  const deleteMineralType = async (id: string) => {
    try {
      const response = await api.delete(`mineral-types/${id}`);
      if (response.status === 200) {
        toast.success("Mineral type deleted successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete mineral type"
      );
      return false;
    }
  };

  return {
    getMineralTypes,
    createMineralType,
    updateMineralType,
    deleteMineralType,
  };
};
