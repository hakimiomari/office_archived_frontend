import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type EmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "TERMINATED";

export type Department = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { employees: number };
};

export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  departmentId: number | null;
  designation: string | null;
  hireDate: string | null;
  status: EmployeeStatus;
  profilePicture: string | null;
  address: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
};

export type EmployeeSummary = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeave: number;
  totalDepartments: number;
  byDepartment: {
    departmentId: number | null;
    departmentName: string;
    count: number;
  }[];
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = { data: T[]; meta: Meta };

export const useEmployees = () => {
  // --- Summary ---
  const getSummary = async (): Promise<EmployeeSummary | null> => {
    try {
      const response = await api.get("employees/summary");
      return response.data;
    } catch {
      return null;
    }
  };

  // --- Employees ---
  const getEmployees = async (
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      status?: EmployeeStatus;
      departmentId?: number;
    } = {},
  ): Promise<ListResponse<Employee>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`employees?${params.toString()}`);
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const getEmployeeById = async (id: number): Promise<Employee | null> => {
    try {
      const response = await api.get(`employees/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const getEmployeeEquipment = async (id: number): Promise<any[]> => {
    try {
      const response = await api.get(`employees/${id}/equipment`);
      return response.data;
    } catch {
      return [];
    }
  };

  const createEmployee = async (
    data: Partial<Employee>,
  ): Promise<Employee | null> => {
    try {
      const response = await api.post("employees", data);
      toast.success("Employee created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create employee");
      return null;
    }
  };

  const updateEmployee = async (
    id: number,
    data: Partial<Employee>,
  ): Promise<Employee | null> => {
    try {
      const response = await api.patch(`employees/${id}`, data);
      toast.success("Employee updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update employee");
      return null;
    }
  };

  const deleteEmployee = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`employees/${id}`);
      toast.success("Employee deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete employee");
      return false;
    }
  };

  // --- Departments ---
  const getDepartments = async (
    filters: { page?: number; limit?: number; search?: string } = {},
  ): Promise<ListResponse<Department>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(
        `employees/departments?${params.toString()}`,
      );
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const createDepartment = async (
    data: Partial<Department>,
  ): Promise<Department | null> => {
    try {
      const response = await api.post("employees/departments", data);
      toast.success("Department created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create department",
      );
      return null;
    }
  };

  const updateDepartment = async (
    id: number,
    data: Partial<Department>,
  ): Promise<Department | null> => {
    try {
      const response = await api.patch(`employees/departments/${id}`, data);
      toast.success("Department updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update department",
      );
      return null;
    }
  };

  const deleteDepartment = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`employees/departments/${id}`);
      toast.success("Department deleted");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete department",
      );
      return false;
    }
  };

  return {
    getSummary,
    getEmployees,
    getEmployeeById,
    getEmployeeEquipment,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
};
