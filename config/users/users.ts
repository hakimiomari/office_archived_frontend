import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type UserType = {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
  userRole?: "ADMIN" | "USER";
  created_at: string;
  updated_at: string;
  roles: { id: number; name: string }[];
};

export type UserMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useUsers = () => {
  const getUsers = async (page = 1, limit = 10, search?: string) => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const response = await api.get(`user/list?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const getUser = async (id: number) => {
    try {
      const response = await api.get(`user/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch user");
      return null;
    }
  };

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: number;
    /** App role: ADMIN (full system) or USER (limited by permissions). */
    userRole?: "ADMIN" | "USER";
  }) => {
    try {
      const response = await api.post("user/create", data);
      toast.success("User created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create user");
      return null;
    }
  };

  const updateUser = async (
    id: number,
    data: { name?: string; email?: string; profile_picture?: string; roleIds?: number[] }
  ) => {
    try {
      const response = await api.patch(`user/${id}`, data);
      toast.success("User updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update user");
      return null;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await api.delete(`user/${id}`);
      toast.success("User deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
      return false;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; profile_picture?: string }) => {
    try {
      const response = await api.patch("user/profile/update", data);
      toast.success("Profile updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
      return null;
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await api.post("user/change-password", data);
      toast.success("Password changed successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to change password");
      return false;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("user/profile/upload-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload profile picture");
      return null;
    }
  };

  return { getUsers, getUser, createUser, updateUser, deleteUser, updateProfile, changePassword, uploadProfilePicture };
};
