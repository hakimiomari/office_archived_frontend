"use client";

import { useEffect, useState } from "react";
import {
  useInventory,
  Purchase,
  PurchaseStatus,
  Item,
  Supplier,
  Warehouse,
  Meta,
} from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  IconCheck,
  IconCash,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

type LineItem = {
  itemId: string;
  quantity: string;
  price: string;
};

export default function PurchasesPage() {
  const {
    getPurchases,
    createPurchase,
    deletePurchase,
    receivePurchase,
    getItems,
    getSuppliers,
    getWarehouses,
    createSupplierPayment,
  } = useInventory();
  const { can } = usePermission();
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    referenceNo: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: "",
    paidAmount: "0",
    lineItems: [{ itemId: "", quantity: "", price: "" }] as LineItem[],
  });
  const [saving, setSaving] = useState(false);

  const [receiveDialog, setReceiveDialog] = useState<Purchase | null>(null);
  const [receiveWarehouse, setReceiveWarehouse] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Supplier payment dialog
  const [payDialog, setPayDialog] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getPurchases({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    });
    setPurchases(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [statusFilter, page, limit]);

  useEffect(() => {
    (async () => {
      const [itemsRes, supRes, whRes] = await Promise.all([
        getItems({ limit: 500 }),
        getSuppliers({ limit: 200 }),
        getWarehouses({ limit: 100 }),
      ]);
      setItems(itemsRes.data);
      setSuppliers(supRes.data);
      setWarehouses(whRes.data);
    })();
  }, []);

  const openCreate = () => {
    setForm({
      supplierId: "",
      referenceNo: "",
      purchaseDate: new Date().toISOString().slice(0, 10),
      notes: "",
      paidAmount: "0",
      lineItems: [{ itemId: "", quantity: "", price: "" }],
    });
    setCreateDialog(true);
  };

  const addLineItem = () => {
    setForm({
      ...form,
      lineItems: [...form.lineItems, { itemId: "", quantity: "", price: "" }],
    });
  };

  const removeLineItem = (idx: number) => {
    setForm({
      ...form,
      lineItems: form.lineItems.filter((_, i) => i !== idx),
    });
  };

  const updateLineItem = (idx: number, field: keyof LineItem, value: string) => {
    const newItems = [...form.lineItems];
    newItems[idx][field] = value;
    setForm({ ...form, lineItems: newItems });
  };

  const totalAmount = form.lineItems.reduce(
    (sum, li) => sum + (Number(li.price) || 0) * (Number(li.quantity) || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = form.lineItems
      .filter((li) => li.itemId && Number(li.quantity) > 0)
      .map((li) => ({
        itemId: Number(li.itemId),
        quantity: Number(li.quantity),
        price: Number(li.price) || 0,
      }));

    if (validItems.length === 0) return;

    setSaving(true);
    const result = await createPurchase({
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      referenceNo: form.referenceNo || undefined,
      purchaseDate: form.purchaseDate,
      notes: form.notes || undefined,
      paidAmount: Number(form.paidAmount) || 0,
      items: validItems,
    });
    setSaving(false);
    if (result) {
      setCreateDialog(false);
      fetch();
    }
  };

  const handleReceive = async () => {
    if (!receiveDialog || !receiveWarehouse) return;
    const ok = await receivePurchase(receiveDialog.id, Number(receiveWarehouse));
    if (ok) {
      setReceiveDialog(null);
      setReceiveWarehouse("");
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deletePurchase(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  const statusVariant = (status: PurchaseStatus) => {
    switch (status) {
      case "RECEIVED": return "default";
      case "PENDING": return "secondary";
      case "CANCELLED": return "destructive";
      default: return "outline";
    }
  };

  const statusLabel = (status: PurchaseStatus) => {
    return status === "RECEIVED" ? t("statusReceived")
      : status === "PENDING" ? t("statusPending")
      : t("statusCancelled");
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("purchases")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="inventory.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newPurchase")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder={t("searchPurchases")}
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
              <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
              <SelectItem value="RECEIVED">{t("statusReceived")}</SelectItem>
              <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">#</TableHead>
                <TableHead className="px-4 py-2">{t("referenceNo")}</TableHead>
                <TableHead className="px-4 py-2">{t("supplier")}</TableHead>
                <TableHead className="px-4 py-2">{t("purchaseDate")}</TableHead>
                <TableHead className="px-4 py-2">{t("totalAmount")}</TableHead>
                <TableHead className="px-4 py-2">{t("paidAmount")}</TableHead>
                <TableHead className="px-4 py-2">{t("remainingAmount")}</TableHead>
                <TableHead className="px-4 py-2">{t("paymentStatus")}</TableHead>
                <TableHead className="px-4 py-2">{t("status")}</TableHead>
                <TableHead className="px-4 py-2">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    {t("noPurchases")}
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-2">
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium">
                      {p.referenceNo || `#${p.id}`}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {p.supplier?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium">
                      {p.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-green-600">
                      {p.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`px-4 py-2 ${p.remainingAmount > 0 ? "text-red-600 font-semibold" : ""}`}
                    >
                      {p.remainingAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge
                        variant={
                          p.paymentStatus === "PAID"
                            ? "default"
                            : p.paymentStatus === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {t(`paymentStatus_${p.paymentStatus}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusVariant(p.status)}>
                        {statusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {p.status === "PENDING" && can("inventory.movement") && (
                            <DropdownMenuItem
                              onClick={() => {
                                setReceiveDialog(p);
                                setReceiveWarehouse("");
                              }}
                            >
                              <IconCheck className="me-2 h-4 w-4 text-green-600" />
                              {t("receivePurchase")}
                            </DropdownMenuItem>
                          )}
                          {p.remainingAmount > 0 &&
                            can("inventory.create") &&
                            p.supplierId && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setPayDialog(p);
                                  setPayAmount(String(p.remainingAmount));
                                }}
                              >
                                <IconCash className="me-2 h-4 w-4 text-green-600" />
                                {t("recordSupplierPayment")}
                              </DropdownMenuItem>
                            )}
                          {can("inventory.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(p.id)}
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
                {purchases.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
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

      {/* Create purchase dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newPurchase")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("supplier")}</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm({ ...form, supplierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSupplier")} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refNo">{t("referenceNo")}</Label>
                <Input
                  id="refNo"
                  value={form.referenceNo}
                  onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pDate">{t("purchaseDate")}</Label>
              <Input
                id="pDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("items")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <IconPlus className="me-1 h-3 w-3" />
                  {t("addItem")}
                </Button>
              </div>
              <div className="rounded-md border p-2 space-y-2">
                {form.lineItems.map((li, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t("item")}</Label>
                      <Select
                        value={li.itemId}
                        onValueChange={(v) => updateLineItem(idx, "itemId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectItem")} />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">{t("quantity")}</Label>
                      <Input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={li.quantity}
                        onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">{t("price")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.price}
                        onChange={(e) => updateLineItem(idx, "price", e.target.value)}
                      />
                    </div>
                    {form.lineItems.length > 1 && (
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
                ))}
              </div>
              <p className="text-right text-sm font-semibold">
                {t("totalAmount")}: {totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pPaid">{t("paidAmount")}</Label>
                <Input
                  id="pPaid"
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(e) =>
                    setForm({ ...form, paidAmount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pNotes">{t("notes")}</Label>
                <Input
                  id="pNotes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tCommon("saving") : tCommon("submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive purchase dialog */}
      <Dialog
        open={!!receiveDialog}
        onOpenChange={(open) => !open && setReceiveDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("receivePurchaseTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("receivePurchaseDescription")}
          </p>
          <div className="space-y-2">
            <Label>{t("targetWarehouse")}</Label>
            <Select value={receiveWarehouse} onValueChange={setReceiveWarehouse}>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReceiveDialog(null)}>
              {tCommon("cancel")}
            </Button>
            <Button disabled={!receiveWarehouse} onClick={handleReceive}>
              {t("receivePurchase")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier payment dialog */}
      <Dialog
        open={!!payDialog}
        onOpenChange={(open) => !open && setPayDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recordSupplierPayment")}</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="grid gap-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("referenceNo")}:
                  </span>
                  <span className="font-semibold">
                    {payDialog.referenceNo || `#${payDialog.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("supplier")}:
                  </span>
                  <span>{payDialog.supplier?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("remainingAmount")}:
                  </span>
                  <span className="text-red-600 font-semibold">
                    {payDialog.remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supAmount">{t("amount")}</Label>
                <Input
                  id="supAmount"
                  type="number"
                  min="0.01"
                  max={payDialog.remainingAmount}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPayDialog(null)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  disabled={
                    savingPayment ||
                    !payAmount ||
                    Number(payAmount) <= 0 ||
                    Number(payAmount) > payDialog.remainingAmount
                  }
                  onClick={async () => {
                    if (!payDialog || !payDialog.supplierId) return;
                    const amount = Number(payAmount);
                    if (!amount || amount <= 0) return;
                    setSavingPayment(true);
                    const result = await createSupplierPayment({
                      supplierId: payDialog.supplierId,
                      purchaseId: payDialog.id,
                      amount,
                      method: "CASH",
                    });
                    setSavingPayment(false);
                    if (result) {
                      setPayDialog(null);
                      fetch();
                    }
                  }}
                >
                  {savingPayment ? tCommon("saving") : t("recordPayment")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deletePurchase")}
        description={t("deletePurchaseConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
