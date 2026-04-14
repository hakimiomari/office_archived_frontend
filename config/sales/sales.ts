import api from "@/lib/api/axios";
import toast from "react-hot-toast";

export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";
export type PaymentMethod =
  | "CASH"
  | "BANK"
  | "MOBILE"
  | "CREDIT"
  | "OTHER";
export type SaleStatus = "COMPLETED" | "CANCELLED";

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number;
  totalOwed: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = Customer & {
  sales: Sale[];
  recentPayments: Payment[];
  stats: {
    salesCount: number;
    totalSpent: number;
    totalPaid: number;
    totalRemaining: number;
  };
};

export type SaleItem = {
  id: number;
  saleId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  item?: {
    id: number;
    name: string;
    sku: string | null;
    unit: string;
  };
};

export type Payment = {
  id: number;
  saleId: number;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  referenceNo: string | null;
  notes: string | null;
  employeeId: number | null;
  createdAt: string;
  sale?: Sale;
};

export type Sale = {
  id: number;
  invoiceNo: string;
  customerId: number | null;
  warehouseId: number;
  employeeId: number | null;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  saleStatus: SaleStatus;
  saleDate: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  items?: SaleItem[];
  payments?: Payment[];
  _count?: { payments: number };
};

export type SalesSummary = {
  totalSales: number;
  todayRevenue: number;
  monthRevenue: number;
  totalCustomers: number;
  pendingPayments: number;
  monthCashReceived: number;
};

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type SalesReport = {
  period: ReportPeriod;
  range: { start: string; end: string };
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
    subtotal: number;
    discount: number;
    tax: number;
    cashReceived: number;
    pendingPayments: number;
  };
  counts: {
    salesCount: number;
    purchasesCount: number;
  };
  byStatus: { status: PaymentStatus; count: number; total: number }[];
  topProducts: {
    itemId: number;
    name: string;
    sku: string | null;
    quantity: number;
    revenue: number;
  }[];
  revenueTrend: { day: string; revenue: number; count: number }[];
};

export type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = { data: T[]; meta: Meta };

type SaleLineInput = {
  itemId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type CreateSaleInput = {
  customerId?: number;
  warehouseId: number;
  employeeId?: number;
  items: SaleLineInput[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  saleDate?: string;
  dueDate?: string;
  notes?: string;
};

export const useSales = () => {
  // --- Summary ---
  const getSummary = async (): Promise<SalesSummary | null> => {
    try {
      const response = await api.get("sales/summary");
      return response.data;
    } catch {
      return null;
    }
  };

  const getReport = async (
    period: ReportPeriod = "monthly",
    from?: string,
    to?: string,
  ): Promise<SalesReport | null> => {
    try {
      const params = new URLSearchParams({ period });
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const response = await api.get(`sales/reports?${params.toString()}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const getOverdueSales = async (
    filters: { customerId?: number; from?: string; to?: string } = {},
  ): Promise<Sale[]> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`sales/overdue?${params.toString()}`);
      return response.data;
    } catch {
      return [];
    }
  };

  // --- Customers ---
  const getCustomers = async (
    filters: { page?: number; limit?: number; search?: string } = {},
  ): Promise<ListResponse<Customer>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`sales/customers?${params.toString()}`);
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const getCustomerById = async (
    id: number,
  ): Promise<CustomerDetail | null> => {
    try {
      const response = await api.get(`sales/customers/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const createCustomer = async (
    data: Partial<Customer>,
  ): Promise<Customer | null> => {
    try {
      const response = await api.post("sales/customers", data);
      toast.success("Customer created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create customer");
      return null;
    }
  };

  const updateCustomer = async (
    id: number,
    data: Partial<Customer>,
  ): Promise<Customer | null> => {
    try {
      const response = await api.patch(`sales/customers/${id}`, data);
      toast.success("Customer updated successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update customer");
      return null;
    }
  };

  const deleteCustomer = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`sales/customers/${id}`);
      toast.success("Customer deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete customer");
      return false;
    }
  };

  // --- Sales ---
  const getSales = async (
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      customerId?: number;
      paymentStatus?: PaymentStatus;
      saleStatus?: SaleStatus;
      from?: string;
      to?: string;
    } = {},
  ): Promise<ListResponse<Sale>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`sales?${params.toString()}`);
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const getSaleById = async (id: number): Promise<Sale | null> => {
    try {
      const response = await api.get(`sales/${id}`);
      return response.data;
    } catch {
      return null;
    }
  };

  const createSale = async (data: CreateSaleInput): Promise<Sale | null> => {
    try {
      const response = await api.post("sales", data);
      toast.success("Sale created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create sale");
      return null;
    }
  };

  const cancelSale = async (id: number): Promise<Sale | null> => {
    try {
      const response = await api.patch(`sales/${id}/cancel`);
      toast.success("Sale cancelled and stock restored");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel sale");
      return null;
    }
  };

  const deleteSale = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`sales/${id}`);
      toast.success("Sale deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete sale");
      return false;
    }
  };

  // --- Payments ---
  const getPayments = async (
    filters: {
      page?: number;
      limit?: number;
      saleId?: number;
      method?: PaymentMethod;
      from?: string;
      to?: string;
    } = {},
  ): Promise<ListResponse<Payment>> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`sales/payments?${params.toString()}`);
      return response.data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  };

  const createPayment = async (data: {
    saleId: number;
    amount: number;
    method?: PaymentMethod;
    paymentDate?: string;
    referenceNo?: string;
    notes?: string;
    employeeId?: number;
  }): Promise<Payment | null> => {
    try {
      const response = await api.post("sales/payments", data);
      toast.success("Payment recorded");
      return response.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to record payment");
      return null;
    }
  };

  const downloadCustomerReportPdf = async (
    customerId: number,
    customerName: string,
    from?: string,
    to?: string,
  ): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const response = await api.get(
        `sales/customers/${customerId}/report-pdf?${params.toString()}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const safeName = customerName.replace(/[^a-z0-9]+/gi, "_");
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `customer_${customerId}_${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to download customer report",
      );
      return false;
    }
  };

  const downloadInvoicePdf = async (
    saleId: number,
    invoiceNo: string,
  ): Promise<boolean> => {
    try {
      const response = await api.get(`sales/${saleId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to download PDF");
      return false;
    }
  };

  const deletePayment = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`sales/payments/${id}`);
      toast.success("Payment deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete payment");
      return false;
    }
  };

  return {
    getSummary,
    getReport,
    getOverdueSales,
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getSales,
    getSaleById,
    createSale,
    cancelSale,
    deleteSale,
    getPayments,
    createPayment,
    deletePayment,
    downloadInvoicePdf,
    downloadCustomerReportPdf,
  };
};
