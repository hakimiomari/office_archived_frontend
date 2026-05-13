"use client";

import { useEffect, useState } from "react";
import {
  useEquipment,
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentSummary,
  Meta,
} from "@/config/equipment/equipment";
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
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceLaptop,
  IconCircleCheck,
  IconUser,
  IconTool,
  IconArchive,
  IconAlertTriangle,
  IconBan,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

type FormData = {
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyExpiry: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  notes: string;
};

const emptyForm: FormData = {
  name: "",
  category: "OTHER",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  purchasePrice: "0",
  warrantyExpiry: "",
  status: "AVAILABLE",
  condition: "GOOD",
  notes: "",
};

const CATEGORIES: EquipmentCategory[] = [
  "LAPTOP",
  "DESKTOP",
  "PRINTER",
  "PHONE",
  "FURNITURE",
  "NETWORK",
  "MONITOR",
  "OTHER",
];

const STATUSES: EquipmentStatus[] = [
  "AVAILABLE",
  "ASSIGNED",
  "MAINTENANCE",
  "RETIRED",
];

const CONDITIONS: EquipmentCondition[] = ["NEW", "GOOD", "FAIR", "DAMAGED"];

export default function EquipmentPage() {
  const {
    getSummary,
    getEquipment,
    createEquipment,
    updateEquipment,
    retireEquipment,
    deleteEquipment,
  } = useEquipment();
  const { can } = usePermission();
  const t = useTranslations("equipment");
  const tCommon = useTranslations("common");

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    EquipmentCategory | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "ALL">(
    "ALL",
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [retireId, setRetireId] = useState<number | null>(null);
  const [retiring, setRetiring] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const [result, sum] = await Promise.all([
      getEquipment({
        page,
        limit,
        search: search || undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
      getSummary(),
    ]);
    setEquipment(result.data);
    setMeta(result.meta);
    setSummary(sum);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, categoryFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setForm({
      name: eq.name,
      category: eq.category,
      brand: eq.brand ?? "",
      model: eq.model ?? "",
      serialNumber: eq.serialNumber ?? "",
      purchaseDate: eq.purchaseDate
        ? new Date(eq.purchaseDate).toISOString().slice(0, 10)
        : "",
      purchasePrice: String(eq.purchasePrice),
      warrantyExpiry: eq.warrantyExpiry
        ? new Date(eq.warrantyExpiry).toISOString().slice(0, 10)
        : "",
      status: eq.status,
      condition: eq.condition,
      notes: eq.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      brand: form.brand || undefined,
      model: form.model || undefined,
      serialNumber: form.serialNumber || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: Number(form.purchasePrice) || 0,
      warrantyExpiry: form.warrantyExpiry || undefined,
      status: form.status,
      condition: form.condition,
      notes: form.notes || undefined,
    };
    const result = editing
      ? await updateEquipment(editing.id, payload as any)
      : await createEquipment(payload as any);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteEquipment(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  const handleRetire = async () => {
    if (!retireId) return;
    setRetiring(true);
    const ok = await retireEquipment(retireId);
    setRetiring(false);
    setRetireId(null);
    if (ok) fetch();
  };

  const statusVariant = (status: EquipmentStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "default";
      case "ASSIGNED":
        return "secondary";
      case "MAINTENANCE":
        return "outline";
      case "RETIRED":
        return "destructive";
    }
  };

  const conditionClass = (cond: EquipmentCondition) => {
    switch (cond) {
      case "NEW":
        return "text-green-600";
      case "GOOD":
        return "text-blue-600";
      case "FAIR":
        return "text-yellow-600";
      case "DAMAGED":
        return "text-red-600";
    }
  };

  return (
    <RouteGuard permission="equipment.read">
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
          <PermissionGate permission="equipment.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newEquipment")}
            </Button>
          </PermissionGate>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconDeviceLaptop className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("total")}</p>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (summary?.totalEquipment ?? 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("available")}
                </p>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (summary?.available ?? 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconUser className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("assigned")}</p>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (summary?.assigned ?? 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <IconTool className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("inMaintenance")}
                </p>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  (summary?.maintenance ?? 0)
                )}
                {summary && summary.warrantyExpiringSoon > 0 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-0.5">
                    <IconAlertTriangle className="h-3 w-3" />
                    {summary.warrantyExpiringSoon} {t("warrantyExpiringSoon")}
                  </p>
                )}
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
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tCommon("all")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`category_${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={tCommon("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tCommon("all")}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("equipmentName")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("serialNumber")}</TableHead>
                <TableHead>{t("brand")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{t("condition")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noEquipment")}
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((eq, idx) => (
                  <TableRow key={eq.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) +
                        idx +
                        1}
                    </TableCell>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell>{t(`category_${eq.category}`)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {eq.serialNumber || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {eq.brand || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(eq.status)}>
                        {t(`status_${eq.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`font-medium ${conditionClass(eq.condition)}`}
                    >
                      {t(`condition_${eq.condition}`)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can("equipment.update") && (
                            <DropdownMenuItem onClick={() => openEdit(eq)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("equipment.update") &&
                            eq.status !== "RETIRED" && (
                              <DropdownMenuItem
                                onClick={() => setRetireId(eq.id)}
                              >
                                <IconArchive className="me-2 h-4 w-4" />
                                {t("retire")}
                              </DropdownMenuItem>
                            )}
                          {can("equipment.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(eq.id)}
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
                {equipment.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")} {Math.min(meta.page * meta.limit, meta.total)}{" "}
                {tCommon("of")} {meta.total}
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
                  {tCommon("page")} {meta.page} {tCommon("of")}{" "}
                  {meta.totalPages}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editEquipment") : t("newEquipment")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("equipmentName")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as EquipmentCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`category_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">{t("brand")}</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{t("model")}</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial">{t("serialNumber")}</Label>
              <Input
                id="serial"
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pdate">{t("purchaseDate")}</Label>
                <Input
                  id="pdate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pprice">{t("purchasePrice")}</Label>
                <Input
                  id="pprice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, purchasePrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">{t("warrantyExpiry")}</Label>
              <Input
                id="warranty"
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) =>
                  setForm({ ...form, warrantyExpiry: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{tCommon("status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as EquipmentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status_${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("condition")}</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) =>
                    setForm({ ...form, condition: v as EquipmentCondition })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`condition_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{tCommon("notes") || "Notes"}</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteEquipment")}
        description={t("deleteEquipmentConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!retireId}
        onOpenChange={(open) => !open && setRetireId(null)}
        title={t("retireEquipment")}
        description={t("retireEquipmentConfirm")}
        onConfirm={handleRetire}
        loading={retiring}
      />
    </RouteGuard>
  );
}
