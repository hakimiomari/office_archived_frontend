import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type PermissionType = {
  id: number;
  name: string;
  group_name: string;
  label: string;
};

export type RoleType = {
  id: number;
  name: string;
  created_at: string;
  permissions: PermissionType[];
  _count?: { users: number };
  users?: { id: number; name: string; email: string }[];
};

export const useRoles = () => {
  const getRoles = async (): Promise<RoleType[]> => {
    try {
      const response = await api.get("roles");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch roles");
      return [];
    }
  };

  const getRole = async (id: number): Promise<RoleType | null> => {
    try {
      const response = await api.get(`roles/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch role");
      return null;
    }
  };

  const createRole = async (data: { name: string; permissionIds?: number[] }) => {
    try {
      const response = await api.post("roles", data);
      toast.success("Role created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create role");
      return null;
    }
  };

  const updateRole = async (id: number, data: { name?: string; permissionIds?: number[] }) => {
    try {
      const response = await api.patch(`roles/${id}`, data);
      toast.success("Role updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update role");
      return null;
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await api.delete(`roles/${id}`);
      toast.success("Role deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role");
      return false;
    }
  };

  const getPermissions = async (): Promise<PermissionType[]> => {
    try {
      const response = await api.get("roles/permissions");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch permissions");
      return [];
    }
  };

  return { getRoles, getRole, createRole, updateRole, deleteRole, getPermissions };
};
