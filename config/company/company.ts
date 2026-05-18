import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type Owner = {
  id: string;
  name: string;
  position: string;
  shareAmount: string | number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

export type Company = {
  id: string;
  name: string;
  licenseNumber: string;
  TIN: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  owners?: Owner[];
  miningLicense?: any[];
  _count?: { miningLicense: number };
};

export type CompanyMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useCompanies = () => {
  const getCompanies = async (
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{ data: Company[]; meta: CompanyMeta | null }> => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const response = await api.get(`companies?${params.toString()}`);
      return { data: response.data.data, meta: response.data.meta };
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch companies"
      );
      return { data: [], meta: null };
    }
  };

  const getCompany = async (id: string): Promise<Company | null> => {
    try {
      const response = await api.get(`companies/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch company"
      );
      return null;
    }
  };

  const createCompany = async (data: {
    name: string;
    licenseNumber: string;
    TIN: string;
    address: string;
  }) => {
    try {
      const response = await api.post("companies", data);
      if (response.status === 201) {
        toast.success("Company created successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create company"
      );
      return null;
    }
  };

  const updateCompany = async (id: string, data: any) => {
    try {
      const response = await api.patch(`companies/${id}`, data);
      if (response.status === 200) {
        toast.success("Company updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update company"
      );
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const response = await api.delete(`companies/${id}`);
      if (response.status === 200) {
        toast.success("Company deleted successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete company"
      );
      return false;
    }
  };

  // ---- Owners ----

  const addOwner = async (
    companyId: string,
    data: { name: string; position: string; shareAmount: number }
  ) => {
    try {
      const response = await api.post(`companies/${companyId}/owners`, data);
      if (response.status === 201) {
        toast.success("Owner added successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add owner");
      return null;
    }
  };

  const updateOwner = async (
    companyId: string,
    ownerId: string,
    data: { name?: string; position?: string; shareAmount?: number }
  ) => {
    try {
      const response = await api.patch(
        `companies/${companyId}/owners/${ownerId}`,
        data
      );
      if (response.status === 200) {
        toast.success("Owner updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update owner"
      );
      return null;
    }
  };

  const deleteOwner = async (companyId: string, ownerId: string) => {
    try {
      const response = await api.delete(
        `companies/${companyId}/owners/${ownerId}`
      );
      if (response.status === 200) {
        toast.success("Owner removed successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to remove owner"
      );
      return false;
    }
  };

  return {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    addOwner,
    updateOwner,
    deleteOwner,
  };
};
