import api from "@/lib/api/axios";
import toast from "react-hot-toast";

// ============================ Types ============================

export type StockMovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export type StockMovementReference =
  | "PURCHASE"
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
  unit: string;
  description: string | null;
  minStock: number;
  maxStock: number | null;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  leadTimeDays: number | null;
  salePrice: number;
  purchasePrice: number;
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
  totalOwed: number;
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

export type PurchasePaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type Purchase = {
  id: number;
  supplierId: number | null;
  referenceNo: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PurchasePaymentStatus;
  purchaseDate: string;
  status: PurchaseStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier | null;
  items?: PurchaseItem[];
};

export type SupplierPayment = {
  id: number;
  supplierId: number;
  purchaseId: number | null;
  amount: number;
  paymentDate: string;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
  supplier?: Supplier;
  purchase?: { id: number; referenceNo: string | null; totalAmount: number } | null;
};

export type StockMovement = {
  id: number;
  itemId: number;
  type: StockMovementType;
  quantity: number;
  unitCost: number | null;
  batchId: number | null;
  sourceWarehouseId: number | null;
  targetWarehouseId: number | null;
  referenceType: StockMovementReference;
  referenceId: number | null;
  purchaseId: number | null;
  idempotencyKey: string | null;
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
  const getWarehouse = async (id: number): Promise<(Warehouse & { stocks: (InventoryStock & { item: Item })[] }) | null> => {
    try {
      const response = await api.get(`inventory/warehouses/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

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
    unitCost?: number;
    batchNo?: string;
    expiryDate?: string;
    idempotencyKey?: string;
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
    idempotencyKey?: string;
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

  const stockAdjustment = async (data: {
    itemId: number;
    warehouseId: number;
    newQuantity: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      await api.post("inventory/stock/adjustment", data);
      toast.success("Stock adjusted successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to adjust stock");
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
    paidAmount?: number;
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

  // ---- Supplier Payments ----
  const getSupplierPayments = async (
    filters: {
      page?: number;
      limit?: number;
      supplierId?: number;
      purchaseId?: number;
    } = {},
  ): Promise<ListResponse<SupplierPayment>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(
        `inventory/supplier-payments?${params.toString()}`,
      );
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const createSupplierPayment = async (data: {
    supplierId: number;
    purchaseId?: number;
    amount: number;
    paymentDate?: string;
    referenceNo?: string;
    notes?: string;
  }): Promise<SupplierPayment | null> => {
    try {
      const response = await api.post("inventory/supplier-payments", data);
      toast.success("Supplier payment recorded");
      return response.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to record supplier payment",
      );
      return null;
    }
  };

  const deleteSupplierPayment = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`inventory/supplier-payments/${id}`);
      toast.success("Supplier payment deleted");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete supplier payment",
      );
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

  const getDeadStock = async (days = 90) => {
    try {
      const response = await api.get(`inventory/reports/dead-stock?days=${days}`);
      return response.data as DeadStockRow[];
    } catch {
      return [];
    }
  };

  const getSalesVelocity = async (days = 30) => {
    try {
      const response = await api.get(`inventory/reports/sales-velocity?days=${days}`);
      return response.data as SalesVelocityReport;
    } catch {
      return null;
    }
  };

  const getTurnover = async (days = 90) => {
    try {
      const response = await api.get(`inventory/reports/turnover?days=${days}`);
      return response.data as TurnoverReport;
    } catch {
      return null;
    }
  };

  const getProfitPerProduct = async (days = 30) => {
    try {
      const response = await api.get(`inventory/reports/profit-per-product?days=${days}`);
      return response.data as ProfitPerProductReport;
    } catch {
      return null;
    }
  };

  const getReorderSuggestions = async () => {
    try {
      const response = await api.get(`inventory/reports/reorder-suggestions`);
      return response.data as ReorderSuggestion[];
    } catch {
      return [];
    }
  };

  return {
    // items
    getItems, getItem, createItem, updateItem, deleteItem,
    // warehouses
    getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse,
    // suppliers
    getSuppliers, createSupplier, updateSupplier, deleteSupplier,
    // movements
    getMovements, stockIn, stockOut, stockTransfer, stockAdjustment,
    // purchases
    getPurchases, createPurchase, receivePurchase, deletePurchase,
    // supplier payments
    getSupplierPayments, createSupplierPayment, deleteSupplierPayment,
    // reports
    getReportSummary, getLowStock, getMovementStats, getByWarehouse, getMonthlyUsage,
    getDeadStock, getSalesVelocity, getTurnover, getProfitPerProduct, getReorderSuggestions,
  };
};

// ====================== Advanced report types ======================

export type DeadStockRow = {
  id: number;
  name: string;
  sku: string | null;
  totalStock: number;
  lastOutAt: string | null;
  daysSinceLastOut: number | null;
};

export type VelocityRow = {
  id: number;
  name: string;
  sku: string | null;
  soldQty: number;
  velocityPerDay: number;
};

export type SalesVelocityReport = {
  windowDays: number;
  items: VelocityRow[];
  fastMoving: VelocityRow[];
  slowMoving: VelocityRow[];
};

export type TurnoverReport = {
  windowDays: number;
  cogs: number;
  avgInventoryValue: number;
  turnoverRate: number;
  daysOfInventory: number | null;
};

export type ProfitPerProductRow = {
  id: number;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
};

export type ProfitPerProductReport = {
  windowDays: number;
  items: ProfitPerProductRow[];
};

export type ReorderSuggestion = {
  id: number;
  name: string;
  sku: string | null;
  totalStock: number;
  velocityPerDay: number;
  leadTimeDays: number;
  reorderPoint: number;
  suggestedQuantity: number;
  needsReorder: boolean;
};
