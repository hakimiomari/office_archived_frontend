import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type EquipmentCategory =
  | "LAPTOP"
  | "DESKTOP"
  | "PRINTER"
  | "PHONE"
  | "FURNITURE"
  | "NETWORK"
  | "MONITOR"
  | "OTHER";

export type EquipmentStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "MAINTENANCE"
  | "RETIRED";

export type EquipmentCondition = "NEW" | "GOOD" | "FAIR" | "DAMAGED";

export type EquipmentAssignmentStatus = "ASSIGNED" | "RETURNED";

export type EquipmentMaintenanceStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type Equipment = {
  id: number;
  name: string;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: number;
  warrantyExpiry: string | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  warehouseId: number | null;
  itemId: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: EquipmentAssignment[];
  maintenances?: EquipmentMaintenance[];
};

export type EquipmentAssignment = {
  id: number;
  equipmentId: number;
  employeeId: number;
  employeeName: string | null;
  assignedDate: string;
  returnDate: string | null;
  status: EquipmentAssignmentStatus;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  equipment?: Pick<
    Equipment,
    "id" | "name" | "category" | "serialNumber" | "brand" | "model"
  >;
};

export type EquipmentMaintenance = {
  id: number;
  equipmentId: number;
  issue: string;
  cost: number;
  maintenanceDate: string;
  completedDate: string | null;
  vendor: string | null;
  status: EquipmentMaintenanceStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  equipment?: Pick<Equipment, "id" | "name" | "category" | "serialNumber">;
};

export type EquipmentSummary = {
  totalEquipment: number;
  available: number;
  assigned: number;
  maintenance: number;
  retired: number;
  byCategory: { category: EquipmentCategory; count: number }[];
  totalMaintenanceCost: number;
  warrantyExpiringSoon: number;
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = { data: T[]; meta: Meta };

export const useEquipment = () => {
  // --- Summary ---
  const getSummary = async (): Promise<EquipmentSummary | null> => {
    try {
      const response = await api.get("equipment/summary");
      return response.data;
    } catch {
      return null;
    }
  };

  const getWarrantyExpiring = async (
    days: number = 30,
  ): Promise<Equipment[]> => {
    try {
      const response = await api.get(
        `equipment/warranty-expiring?days=${days}`,
      );
      return response.data;
    } catch {
      return [];
    }
  };

  // --- Equipment CRUD ---
  const getEquipment = async (
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      category?: EquipmentCategory;
      status?: EquipmentStatus;
      condition?: EquipmentCondition;
      warehouseId?: number;
    } = {},
  ): Promise<ListResponse<Equipment>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`equipment?${params.toString()}`);
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const getEquipmentById = async (id: number): Promise<Equipment | null> => {
    try {
      const response = await api.get(`equipment/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const createEquipment = async (
    data: Partial<Equipment>,
  ): Promise<Equipment | null> => {
    try {
      const response = await api.post("equipment", data);
      toast.success("Equipment created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create equipment");
      return null;
    }
  };

  const updateEquipment = async (
    id: number,
    data: Partial<Equipment>,
  ): Promise<Equipment | null> => {
    try {
      const response = await api.patch(`equipment/${id}`, data);
      toast.success("Equipment updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update equipment");
      return null;
    }
  };

  const retireEquipment = async (id: number): Promise<boolean> => {
    try {
      await api.patch(`equipment/${id}/retire`);
      toast.success("Equipment retired");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to retire equipment");
      return false;
    }
  };

  const deleteEquipment = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`equipment/${id}`);
      toast.success("Equipment deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete equipment");
      return false;
    }
  };

  // --- Assignments ---
  const getAssignments = async (
    filters: {
      page?: number;
      limit?: number;
      equipmentId?: number;
      employeeId?: number;
      status?: EquipmentAssignmentStatus;
    } = {},
  ): Promise<ListResponse<EquipmentAssignment>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(
        `equipment/assignments?${params.toString()}`,
      );
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const createAssignment = async (
    data: Partial<EquipmentAssignment>,
  ): Promise<EquipmentAssignment | null> => {
    try {
      const response = await api.post("equipment/assignments", data);
      toast.success("Equipment assigned successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign equipment");
      return null;
    }
  };

  const returnAssignment = async (
    id: number,
    data: { returnDate?: string; remarks?: string } = {},
  ): Promise<EquipmentAssignment | null> => {
    try {
      const response = await api.patch(
        `equipment/assignments/${id}/return`,
        data,
      );
      toast.success("Equipment returned successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to return equipment");
      return null;
    }
  };

  const deleteAssignment = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`equipment/assignments/${id}`);
      toast.success("Assignment deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete assignment");
      return false;
    }
  };

  // --- Maintenance ---
  const getMaintenance = async (
    filters: {
      page?: number;
      limit?: number;
      equipmentId?: number;
      status?: EquipmentMaintenanceStatus;
    } = {},
  ): Promise<ListResponse<EquipmentMaintenance>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(
        `equipment/maintenance?${params.toString()}`,
      );
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const createMaintenance = async (
    data: Partial<EquipmentMaintenance>,
  ): Promise<EquipmentMaintenance | null> => {
    try {
      const response = await api.post("equipment/maintenance", data);
      toast.success("Maintenance recorded successfully");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create maintenance",
      );
      return null;
    }
  };

  const updateMaintenance = async (
    id: number,
    data: Partial<EquipmentMaintenance>,
  ): Promise<EquipmentMaintenance | null> => {
    try {
      const response = await api.patch(`equipment/maintenance/${id}`, data);
      toast.success("Maintenance updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update maintenance",
      );
      return null;
    }
  };

  const deleteMaintenance = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`equipment/maintenance/${id}`);
      toast.success("Maintenance deleted");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete maintenance",
      );
      return false;
    }
  };

  return {
    // summary
    getSummary,
    getWarrantyExpiring,
    // equipment
    getEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    retireEquipment,
    deleteEquipment,
    // assignments
    getAssignments,
    createAssignment,
    returnAssignment,
    deleteAssignment,
    // maintenance
    getMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
  };
};
