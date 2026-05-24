import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import { AuctionType } from "@/contexts/LicenseContext";

export type AuctionMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuctionSummary = {
  total: number;
  byMineral: { mineral: string; count: number }[];
  totalsByCurrency: { currency: string; total: number }[];
  royaltyByCurrency: { currency: string; royalty: number }[];
};

export const useAuctions = () => {
  const getAuctions = async (
    page = 1,
    limit = 10,
    search?: string,
    mineralTypeId?: string
  ): Promise<{ data: AuctionType[]; meta: AuctionMeta | null }> => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (mineralTypeId) params.append("mineralTypeId", mineralTypeId);
      const response = await api.get(`auctions?${params.toString()}`);
      return { data: response.data.data, meta: response.data.meta };
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch auctions"
      );
      return { data: [], meta: null };
    }
  };

  const getAuction = async (id: string): Promise<AuctionType | null> => {
    try {
      const response = await api.get(`auctions/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch auction"
      );
      return null;
    }
  };

  const createAuction = async (data: {
    mineralTypeId: string;
    round?: string;
    mass: string;
    unit?: string;
    unitPrice: string;
    priceCurrency?: string;
    royalty?: number;
  }) => {
    try {
      const response = await api.post("auctions", data);
      if (response.status === 201) {
        toast.success("Auction created successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create auction"
      );
      return null;
    }
  };

  const updateAuction = async (id: string, data: any) => {
    try {
      const response = await api.patch(`auctions/${id}`, data);
      if (response.status === 200) {
        toast.success("Auction updated successfully");
        return response.data;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update auction"
      );
      return null;
    }
  };

  const deleteAuction = async (id: string) => {
    try {
      const response = await api.delete(`auctions/${id}`);
      if (response.status === 200) {
        toast.success("Auction deleted successfully");
        return true;
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete auction"
      );
      return false;
    }
  };

  const getAuctionSummary = async (): Promise<AuctionSummary | null> => {
    try {
      const response = await api.get(`auctions/summary`);
      return response.data;
    } catch {
      return null;
    }
  };

  return {
    getAuctions,
    getAuction,
    createAuction,
    updateAuction,
    deleteAuction,
    getAuctionSummary,
  };
};
