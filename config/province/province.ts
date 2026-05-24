import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import { ProvinceRef } from "@/contexts/LicenseContext";

export const useProvinces = () => {
  const getProvinces = async (): Promise<ProvinceRef[]> => {
    try {
      const response = await api.get("provinces");
      return response.data ?? [];
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch provinces"
      );
      return [];
    }
  };
  return { getProvinces };
};
