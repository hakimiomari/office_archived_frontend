import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import { ContractType } from "@/contexts/LicenseContext";

export type ContractMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useContracts = () => {
  const getContracts = async (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{ data: ContractType[]; meta: ContractMeta | null }> => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const response = await api.get(`contracts?${params.toString()}`);
      return { data: response.data.data, meta: response.data.meta };
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch contracts"
      );
      return { data: [], meta: null };
    }
  };

  const getContract = async (id: string): Promise<ContractType | null> => {
    try {
      const response = await api.get(`contracts/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch contract"
      );
      return null;
    }
  };

  const createContract = async (data: {
    companyName: string;
    status?: string;
    mineralTypeId: string;
    registrationNumber?: string;
    price: string;
    priceCurrency?: string;
    royalty?: number;
    jobـopportunities?: number;
    social_service_price?: number;
    social_service_currency?: string;
    area?: number;
    unit?: string;
    mineAddress: string;
    issueDate: string;
    expiryDate: string;
  }) => {
    try {
      const response = await api.post("contracts", data);
      if (response.status === 201) {
        toast.success("Contract created successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create contract"
      );
      return null;
    }
  };

  const updateContract = async (id: string, data: any) => {
    try {
      const response = await api.patch(`contracts/${id}`, data);
      if (response.status === 200) {
        toast.success("Contract updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update contract"
      );
      return null;
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const response = await api.delete(`contracts/${id}`);
      if (response.status === 200) {
        toast.success("Contract deleted successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete contract"
      );
      return false;
    }
  };

  return {
    getContracts,
    getContract,
    createContract,
    updateContract,
    deleteContract,
  };
};
