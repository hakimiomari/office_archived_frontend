import api from "@/lib/api/axios";
import toast from "react-hot-toast";
import type { Meta, ListResponse } from "@/config/inventory/inventory";

export type Category = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  parent?: { id: number; name: string } | null;
  children?: { id: number; name: string }[];
  _count?: { children?: number; items?: number };
};

export type CategoryNode = Category & { children: CategoryNode[] };

export const useCategories = () => {
  const list = async (filters: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: number;
  } = {}): Promise<ListResponse<Category>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`categories?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } as Meta };
    }
  };

  const tree = async (): Promise<CategoryNode[]> => {
    try {
      const response = await api.get("categories/tree");
      return response.data;
    } catch {
      return [];
    }
  };

  const create = async (data: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: number;
  }): Promise<Category | null> => {
    try {
      const response = await api.post("categories", data);
      toast.success("Category created");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create category");
      return null;
    }
  };

  const update = async (
    id: number,
    data: { name?: string; slug?: string; description?: string; parentId?: number | null },
  ): Promise<Category | null> => {
    try {
      const response = await api.patch(`categories/${id}`, data);
      toast.success("Category updated");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update category");
      return null;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`categories/${id}`);
      toast.success("Category deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete category");
      return false;
    }
  };

  return { list, tree, create, update, remove };
};
