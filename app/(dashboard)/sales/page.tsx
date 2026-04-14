"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useSales,
  Sale,
  Customer,
  SalesSummary,
  PaymentStatus,
  PaymentMethod,
  Meta,
} from "@/config/sales/sales";
import { useInventory, Item, Warehouse } from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconCash,
  IconReceipt,
  IconUsers,
  IconAlertTriangle,
  IconBan,
  IconFileDownload,
  IconBarcode,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { nextRoute } from "@/lib/route";

type LineItem = {
  itemId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
};

type FormData = {
  customerId: string;
  warehouseId: string;
  items: LineItem[];
  discount: string;
  tax: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  saleDate: string;
  dueDate: string;
  notes: string;
};

const emptyLine: LineItem = {
  itemId: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
};

const emptyForm: FormData = {
  customerId: "",
  warehouseId: "",
  items: [{ ...emptyLine }],
  discount: "0",
  tax: "0",
  paidAmount: "0",
  paymentMethod: "CASH",
  saleDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  notes: "",
};

export default function SalesPage() {
  const {
    getSummary,
    getSales,
    createSale,
    cancelSale,
    deleteSale,
    getCustomers,
    createPayment,
    downloadInvoicePdf,
  } = useSales();
  const { getItems, getWarehouses } = useInventory();
  const { can } = usePermission();
  const { changeRoute } = nextRoute();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");

  const [sales, setSales] = useState<Sale[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">(
    "ALL",
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Create invoice dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState("");

  // Record payment dialog state
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [savingPayment, setSavingPayment] = useState(false);

  // Cancel / delete confirmation state
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Post-sale bill dialog
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);

  const fetch = async () => {
    setLoading(true);
    const [result, sum] = await Promise.all([
      getSales({
        page,
        limit,
        search: search || undefined,
        paymentStatus: statusFilter !== "ALL" ? statusFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
      getSummary(),
    ]);
    setSales(result.data);
    setMeta(result.meta);
    setSummary(sum);
    setLoading(false);
  };

  const fetchLookups = async () => {
    const [cs, it, wh] = await Promise.all([
      getCustomers({ limit: 500 }),
      getItems({ limit: 500 }),
      getWarehouses({ limit: 100 }),
    ]);
    setCustomers(cs.data);
    setItems(it.data);
    setWarehouses(wh.data);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLookups();
  }, []);

  // Computed totals in the create dialog
  const computedTotals = useMemo(() => {
    const subtotal = form.items.reduce((sum, li) => {
      const q = Number(li.quantity) || 0;
      const p = Number(li.unitPrice) || 0;
      const d = Number(li.discount) || 0;
      return sum + q * p - d;
    }, 0);
    const discount = Number(form.discount) || 0;
    const tax = Number(form.tax) || 0;
    const total = Math.max(0, subtotal - discount + tax);
    const paid = Number(form.paidAmount) || 0;
    const remaining = Math.max(0, total - paid);
    return { subtotal, total, paid, remaining };
  }, [form]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      warehouseId: warehouses[0] ? String(warehouses[0].id) : "",
    });
    setBarcode("");
    setDialogOpen(true);
  };

  // Barcode / SKU lookup: add matching item as a new line (or bump qty if present)
  const handleBarcodeScan = (value: string) => {
    const code = value.trim();
    if (!code) return;
    const match = items.find(
      (i) => i.sku?.toLowerCase() === code.toLowerCase(),
    );
    if (!match) {
      toast.error(`${t("unknownBarcode")}: ${code}`);
      setBarcode("");
      return;
    }

    const existingIdx = form.items.findIndex(
      (li) => li.itemId === String(match.id),
    );
    const newItems = [...form.items];
    if (existingIdx >= 0) {
      const current = Number(newItems[existingIdx].quantity) || 0;
      newItems[existingIdx] = {
        ...newItems[existingIdx],
        quantity: String(current + 1),
      };
    } else {
      // Replace the first empty line, or append
      const emptyIdx = newItems.findIndex((li) => !li.itemId);
      const line: LineItem = {
        itemId: String(match.id),
        quantity: "1",
        unitPrice: String((match as any).salePrice ?? 0),
        discount: "0",
      };
      if (emptyIdx >= 0) newItems[emptyIdx] = line;
      else newItems.push(line);
    }
    setForm({ ...form, items: newItems });
    setBarcode("");
    toast.success(`${match.name}`);
  };

  const addLineItem = () => {
    setForm({ ...form, items: [...form.items, { ...emptyLine }] });
  };

  const removeLineItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    // Auto-fill unit price from item.salePrice when item is selected
    if (field === "itemId") {
      const item = items.find((i) => String(i.id) === value);
      if (item && (item as any).salePrice) {
        newItems[idx].unitPrice = String((item as any).salePrice);
      }
    }
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = form.items
      .filter((li) => li.itemId && Number(li.quantity) > 0)
      .map((li) => ({
        itemId: Number(li.itemId),
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice) || 0,
        discount: Number(li.discount) || 0,
      }));
    if (validItems.length === 0 || !form.warehouseId) return;

    setSaving(true);
    const result = await createSale({
      customerId: form.customerId ? Number(form.customerId) : undefined,
      warehouseId: Number(form.warehouseId),
      items: validItems,
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      paidAmount: Number(form.paidAmount) || 0,
      paymentMethod: form.paymentMethod,
      saleDate: form.saleDate,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      setCreatedSale(result);
      fetch();
    }
  };

  const openPayment = (sale: Sale) => {
    setPaymentSale(sale);
    setPaymentAmount(String(sale.remainingAmount));
    setPaymentMethod("CASH");
  };

  const handlePayment = async () => {
    if (!paymentSale) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    setSavingPayment(true);
    const result = await createPayment({
      saleId: paymentSale.id,
      amount,
      method: paymentMethod,
    });
    setSavingPayment(false);
    if (result) {
      setPaymentSale(null);
      fetch();
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    const ok = await cancelSale(cancelId);
    setCancelling(false);
    setCancelId(null);
    if (ok) fetch();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteSale(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  const statusVariant = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PARTIAL":
        return "secondary";
      case "UNPAID":
        return "destructive";
    }
  };

  const fmt = (v: number) => v.toLocaleString();

  return (
    <RouteGuard permission="sale.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="sale.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newSale")}
            </Button>
          </PermissionGate>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCash className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("todayRevenue")}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(summary?.todayRevenue ?? 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconReceipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("monthRevenue")}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(summary?.monthRevenue ?? 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <IconAlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pendingPayments")}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(summary?.pendingPayments ?? 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconUsers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalCustomers")}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    summary?.totalCustomers ?? 0
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetch()}
            className="max-w-md"
          />
          <Button variant="outline" onClick={fetch}>
            {tCommon("search")}
          </Button>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tCommon("all")}</SelectItem>
              <SelectItem value="PAID">{t("paymentStatus_PAID")}</SelectItem>
              <SelectItem value="PARTIAL">
                {t("paymentStatus_PARTIAL")}
              </SelectItem>
              <SelectItem value="UNPAID">
                {t("paymentStatus_UNPAID")}
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("from")}
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">{t("to")}</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
            >
              {tCommon("reset")}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("invoiceNo")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("saleDate")}</TableHead>
                <TableHead>{t("totalAmount")}</TableHead>
                <TableHead>{t("paidAmount")}</TableHead>
                <TableHead>{t("remainingAmount")}</TableHead>
                <TableHead>{t("paymentStatus")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    {t("noSales")}
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale, idx) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {sale.invoiceNo}
                    </TableCell>
                    <TableCell>
                      {sale.customer ? (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() =>
                            changeRoute(`/sales/customers/${sale.customer!.id}`)
                          }
                        >
                          {sale.customer.name}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {fmt(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {fmt(sale.paidAmount)}
                    </TableCell>
                    <TableCell
                      className={
                        sale.remainingAmount > 0 ? "text-red-600" : ""
                      }
                    >
                      {fmt(sale.remainingAmount)}
                    </TableCell>
                    <TableCell>
                      {sale.saleStatus === "CANCELLED" ? (
                        <Badge variant="outline">
                          {t("saleStatus_CANCELLED")}
                        </Badge>
                      ) : (
                        <Badge variant={statusVariant(sale.paymentStatus)}>
                          {t(`paymentStatus_${sale.paymentStatus}`)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              downloadInvoicePdf(sale.id, sale.invoiceNo)
                            }
                          >
                            <IconFileDownload className="me-2 h-4 w-4 text-blue-600" />
                            {t("downloadPdf")}
                          </DropdownMenuItem>
                          {can("payment.create") &&
                            sale.saleStatus === "COMPLETED" &&
                            sale.remainingAmount > 0 && (
                              <DropdownMenuItem
                                onClick={() => openPayment(sale)}
                              >
                                <IconCash className="me-2 h-4 w-4 text-green-600" />
                                {t("recordPayment")}
                              </DropdownMenuItem>
                            )}
                          {can("sale.update") &&
                            sale.saleStatus === "COMPLETED" && (
                              <DropdownMenuItem
                                onClick={() => setCancelId(sale.id)}
                              >
                                <IconBan className="me-2 h-4 w-4" />
                                {t("cancelSale")}
                              </DropdownMenuItem>
                            )}
                          {can("sale.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(sale.id)}
                              className="text-red-600"
                            >
                              <IconTrash className="me-2 h-4 w-4" />
                              {tCommon("delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{tCommon("rowsPerPage")}:</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                {tCommon("showing")}{" "}
                {sales.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")}{" "}
                {Math.min(meta.page * meta.limit, meta.total)} {tCommon("of")}{" "}
                {meta.total}
              </span>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  {tCommon("previous")}
                </Button>
                <span className="text-sm">
                  {tCommon("page")} {meta.page} {tCommon("of")} {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {tCommon("next")}
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create sale dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newSale")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("customer")}</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) =>
                    setForm({ ...form, customerId: v === "NONE" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">—</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("warehouse")}</Label>
                <Select
                  value={form.warehouseId}
                  onValueChange={(v) => setForm({ ...form, warehouseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectWarehouse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sdate">{t("saleDate")}</Label>
                <Input
                  id="sdate"
                  type="date"
                  value={form.saleDate}
                  onChange={(e) =>
                    setForm({ ...form, saleDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Barcode scanner */}
            <div className="space-y-2">
              <Label htmlFor="barcode" className="flex items-center gap-1">
                <IconBarcode className="h-4 w-4" />
                {t("scanBarcode")}
              </Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeScan(barcode);
                  }
                }}
                placeholder={t("scanBarcodePlaceholder")}
                autoFocus
              />
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("items")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <IconPlus className="me-1 h-3 w-3" />
                  {t("addItem")}
                </Button>
              </div>
              <div className="rounded-md border p-2 space-y-2">
                {form.items.map((li, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-end gap-2"
                  >
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">{t("item")}</Label>
                      <Select
                        value={li.itemId}
                        onValueChange={(v) => updateLine(idx, "itemId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectItem")} />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                              {i.sku ? ` (${i.sku})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("quantity")}</Label>
                      <Input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={li.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("unitPrice")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, "unitPrice", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">{t("lineDiscount")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.discount}
                        onChange={(e) =>
                          updateLine(idx, "discount", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      {form.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(idx)}
                        >
                          <IconX className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="disc">{t("discount")}</Label>
                <Input
                  id="disc"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) =>
                    setForm({ ...form, discount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">{t("tax")}</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={(e) =>
                    setForm({ ...form, tax: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid">{t("paidAmount")}</Label>
                <Input
                  id="paid"
                  type="number"
                  min="0"
                  max={computedTotals.total}
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(e) =>
                    setForm({ ...form, paidAmount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("paymentMethod")}</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    setForm({ ...form, paymentMethod: v as PaymentMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      ["CASH", "BANK", "MOBILE", "CREDIT", "OTHER"] as PaymentMethod[]
                    ).map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`paymentMethod_${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Totals summary */}
            <div className="rounded-md border bg-muted/40 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("subtotal")}:
                </span>
                <span className="font-semibold">
                  {fmt(computedTotals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("totalAmount")}:
                </span>
                <span className="font-bold text-lg">
                  {fmt(computedTotals.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("paidAmount")}:
                </span>
                <span className="text-green-600 font-semibold">
                  {fmt(computedTotals.paid)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-muted-foreground">
                  {t("remainingAmount")}:
                </span>
                <span
                  className={`font-semibold ${computedTotals.remaining > 0 ? "text-red-600" : ""}`}
                >
                  {fmt(computedTotals.remaining)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ddate">{t("dueDate")}</Label>
                <Input
                  id="ddate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snotes">{tCommon("notes") || "Notes"}</Label>
                <Input
                  id="snotes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !form.warehouseId ||
                  form.items.every((li) => !li.itemId)
                }
              >
                {saving ? tCommon("saving") : t("createInvoice")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record payment dialog */}
      <Dialog
        open={!!paymentSale}
        onOpenChange={(open) => !open && setPaymentSale(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recordPayment")}</DialogTitle>
          </DialogHeader>
          {paymentSale && (
            <div className="grid gap-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("invoiceNo")}:
                  </span>
                  <span className="font-mono font-semibold">
                    {paymentSale.invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("totalAmount")}:
                  </span>
                  <span>{fmt(paymentSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("remainingAmount")}:
                  </span>
                  <span className="text-red-600 font-semibold">
                    {fmt(paymentSale.remainingAmount)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pamount">{t("amount")}</Label>
                <Input
                  id="pamount"
                  type="number"
                  min="0.01"
                  max={paymentSale.remainingAmount}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("paymentMethod")}</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      ["CASH", "BANK", "MOBILE", "CREDIT", "OTHER"] as PaymentMethod[]
                    ).map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`paymentMethod_${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentSale(null)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  disabled={
                    savingPayment ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0 ||
                    Number(paymentAmount) > paymentSale.remainingAmount
                  }
                  onClick={handlePayment}
                >
                  {savingPayment ? tCommon("saving") : t("recordPayment")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post-sale bill dialog */}
      <Dialog
        open={!!createdSale}
        onOpenChange={(open) => !open && setCreatedSale(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconReceipt className="h-5 w-5 text-green-600" />
              {t("saleCreated")}
            </DialogTitle>
          </DialogHeader>
          {createdSale && (
            <div className="grid gap-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("invoiceNo")}:
                  </span>
                  <span className="font-mono font-semibold">
                    {createdSale.invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("totalAmount")}:
                  </span>
                  <span className="font-bold text-lg">
                    {fmt(createdSale.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("paidAmount")}:
                  </span>
                  <span className="text-green-600 font-semibold">
                    {fmt(createdSale.paidAmount)}
                  </span>
                </div>
                {createdSale.remainingAmount > 0 && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">
                      {t("remainingAmount")}:
                    </span>
                    <span className="text-red-600 font-semibold">
                      {fmt(createdSale.remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreatedSale(null)}
                >
                  {tCommon("close") || "Close"}
                </Button>
                <Button
                  onClick={() => {
                    downloadInvoicePdf(createdSale.id, createdSale.invoiceNo);
                  }}
                >
                  <IconFileDownload className="me-2 h-4 w-4" />
                  {t("downloadPdf")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        title={t("cancelSale")}
        description={t("cancelSaleConfirm")}
        onConfirm={handleCancel}
        loading={cancelling}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteSale")}
        description={t("deleteSaleConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
