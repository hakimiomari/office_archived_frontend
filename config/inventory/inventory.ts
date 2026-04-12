import api from "@/lib/api/axios";
import toast from "react-hot-toast";

// ============================ Types ============================

export type ItemCategory =
  | "OFFICE_SUPPLIES"
  | "IT_EQUIPMENT"
  | "PROJECT_MATERIALS"
  | "CONSUMABLES"
  | "ASSETS"
  | "OTHER";

export type StockMovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export type StockMovementReference =
  | "PURCHASE"
  | "TENDER"
  | "MANUAL"
  | "TRANSFER"
  | "ADJUSTMENT";

export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";

export type Warehouse = {
  id: number;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  totalQuantity?: number;
};

export type InventoryStock = {
  id: number;
  itemId: number;
  warehouseId: number;
  quantity: number;
  warehouse?: Warehouse;
};

export type Item = {
  id: number;
  name: string;
  sku: string | null;
  category: ItemCategory;
  unit: string;
  description: string | null;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  stocks?: InventoryStock[];
  totalStock?: number;
};

export type Supplier = {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseItem = {
  id: number;
  purchaseId: number;
  itemId: number;
  quantity: number;
  price: number;
  item?: Item;
};

export type Purchase = {
  id: number;
  supplierId: number | null;
  referenceNo: string | null;
  totalAmount: number;
  purchaseDate: string;
  status: PurchaseStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier | null;
  items?: PurchaseItem[];
};

export type StockMovement = {
  id: number;
  itemId: number;
  type: StockMovementType;
  quantity: number;
  sourceWarehouseId: number | null;
  targetWarehouseId: number | null;
  referenceType: StockMovementReference;
  referenceId: number | null;
  tenderId: string | null;
  purchaseId: number | null;
  notes: string | null;
  createdAt: string;
  item?: Item;
  sourceWarehouse?: Warehouse | null;
  targetWarehouse?: Warehouse | null;
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = { data: T[]; meta: Meta };

// ============================ Hook ============================

export const useInventory = () => {
  // ---- Items ----
  const getItems = async (filters: {
    page?: number;
    limit?: number;
    search?: string;
    category?: ItemCategory;
    lowStock?: boolean;
  } = {}): Promise<ListResponse<Item>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`inventory/items?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch items");
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const getItem = async (id: number): Promise<Item | null> => {
    try {
      const response = await api.get(`inventory/items/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const createItem = async (data: Partial<Item>): Promise<Item | null> => {
    try {
      const response = await api.post("inventory/items", data);
      toast.success("Item created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create item");
      return null;
    }
  };

  const updateItem = async (id: number, data: Partial<Item>): Promise<Item | null> => {
    try {
      const response = await api.patch(`inventory/items/${id}`, data);
      toast.success("Item updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update item");
      return null;
    }
  };

  const deleteItem = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`inventory/items/${id}`);
      toast.success("Item deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete item");
      return false;
    }
  };

  // ---- Warehouses ----
  const getWarehouses = async (filters: { page?: number; limit?: number; search?: string } = {}): Promise<ListResponse<Warehouse>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
      });
      const response = await api.get(`inventory/warehouses?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const createWarehouse = async (data: Partial<Warehouse>): Promise<Warehouse | null> => {
    try {
      const response = await api.post("inventory/warehouses", data);
      toast.success("Warehouse created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create warehouse");
      return null;
    }
  };

  const updateWarehouse = async (id: number, data: Partial<Warehouse>): Promise<Warehouse | null> => {
    try {
      const response = await api.patch(`inventory/warehouses/${id}`, data);
      toast.success("Warehouse updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update warehouse");
      return null;
    }
  };

  const deleteWarehouse = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`inventory/warehouses/${id}`);
      toast.success("Warehouse deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete warehouse");
      return false;
    }
  };

  // ---- Suppliers ----
  const getSuppliers = async (filters: { page?: number; limit?: number; search?: string } = {}): Promise<ListResponse<Supplier>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
      });
      const response = await api.get(`inventory/suppliers?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const createSupplier = async (data: Partial<Supplier>): Promise<Supplier | null> => {
    try {
      const response = await api.post("inventory/suppliers", data);
      toast.success("Supplier created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create supplier");
      return null;
    }
  };

  const updateSupplier = async (id: number, data: Partial<Supplier>): Promise<Supplier | null> => {
    try {
      const response = await api.patch(`inventory/suppliers/${id}`, data);
      toast.success("Supplier updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update supplier");
      return null;
    }
  };

  const deleteSupplier = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`inventory/suppliers/${id}`);
      toast.success("Supplier deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete supplier");
      return false;
    }
  };

  // ---- Stock movements ----
  const getMovements = async (filters: {
    page?: number;
    limit?: number;
    type?: StockMovementType;
    itemId?: number;
    warehouseId?: number;
  } = {}): Promise<ListResponse<StockMovement>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`inventory/movements?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const stockIn = async (data: {
    itemId: number;
    targetWarehouseId: number;
    quantity: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      await api.post("inventory/stock/in", data);
      toast.success("Stock added successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add stock");
      return false;
    }
  };

  const stockOut = async (data: {
    itemId: number;
    sourceWarehouseId: number;
    quantity: number;
    tenderId?: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      await api.post("inventory/stock/out", data);
      toast.success("Stock removed successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove stock");
      return false;
    }
  };

  const stockTransfer = async (data: {
    itemId: number;
    sourceWarehouseId: number;
    targetWarehouseId: number;
    quantity: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      await api.post("inventory/stock/transfer", data);
      toast.success("Stock transferred successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to transfer stock");
      return false;
    }
  };

  // ---- Purchases ----
  const getPurchases = async (filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PurchaseStatus;
    supplierId?: number;
  } = {}): Promise<ListResponse<Purchase>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
      });
      const response = await api.get(`inventory/purchases?${params.toString()}`);
      return response.data;
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
  };

  const createPurchase = async (data: {
    supplierId?: number;
    referenceNo?: string;
    purchaseDate?: string;
    status?: PurchaseStatus;
    notes?: string;
    items: { itemId: number; quantity: number; price?: number }[];
    targetWarehouseId?: number;
  }): Promise<Purchase | null> => {
    try {
      const response = await api.post("inventory/purchases", data);
      toast.success("Purchase created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create purchase");
      return null;
    }
  };

  const receivePurchase = async (id: number, targetWarehouseId: number): Promise<boolean> => {
    try {
      await api.post(`inventory/purchases/${id}/receive`, { targetWarehouseId });
      toast.success("Purchase received and stock added");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to receive purchase");
      return false;
    }
  };

  const deletePurchase = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`inventory/purchases/${id}`);
      toast.success("Purchase deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete purchase");
      return false;
    }
  };

  // ---- Reports ----
  const getReportSummary = async () => {
    try {
      const response = await api.get("inventory/reports/summary");
      return response.data;
    } catch {
      return null;
    }
  };

  const getLowStock = async () => {
    try {
      const response = await api.get("inventory/reports/low-stock");
      return response.data;
    } catch {
      return [];
    }
  };

  const getMovementStats = async () => {
    try {
      const response = await api.get("inventory/reports/movements");
      return response.data;
    } catch {
      return [];
    }
  };

  const getByWarehouse = async () => {
    try {
      const response = await api.get("inventory/reports/by-warehouse");
      return response.data;
    } catch {
      return [];
    }
  };

  const getMonthlyUsage = async () => {
    try {
      const response = await api.get("inventory/reports/monthly-usage");
      return response.data;
    } catch {
      return [];
    }
  };

  return {
    // items
    getItems, getItem, createItem, updateItem, deleteItem,
    // warehouses
    getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
    // suppliers
    getSuppliers, createSupplier, updateSupplier, deleteSupplier,
    // movements
    getMovements, stockIn, stockOut, stockTransfer,
    // purchases
    getPurchases, createPurchase, receivePurchase, deletePurchase,
    // reports
    getReportSummary, getLowStock, getMovementStats, getByWarehouse, getMonthlyUsage,
  };
};
