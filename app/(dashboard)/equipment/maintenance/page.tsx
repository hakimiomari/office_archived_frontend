"use client";

import { useEffect, useState } from "react";
import {
  useEquipment,
  EquipmentMaintenance,
  EquipmentMaintenanceStatus,
  Equipment,
  Meta,
} from "@/config/equipment/equipment";
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
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

type FormData = {
  equipmentId: string;
  issue: string;
  cost: string;
  maintenanceDate: string;
  completedDate: string;
  vendor: string;
  status: EquipmentMaintenanceStatus;
  notes: string;
};

const emptyForm: FormData = {
  equipmentId: "",
  issue: "",
  cost: "0",
  maintenanceDate: new Date().toISOString().slice(0, 10),
  completedDate: "",
  vendor: "",
  status: "PENDING",
  notes: "",
};

const STATUSES: EquipmentMaintenanceStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function EquipmentMaintenancePage() {
  const {
    getMaintenance,
    getEquipment,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
  } = useEquipment();
  const { can } = usePermission();
  const t = useTranslations("equipment");
  const tCommon = useTranslations("common");

  const [maintenance, setMaintenance] = useState<EquipmentMaintenance[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    EquipmentMaintenanceStatus | "ALL"
  >("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentMaintenance | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getMaintenance({
      page,
      limit,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    });
    setMaintenance(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  const fetchEquipment = async () => {
    const result = await getEquipment({ limit: 500 });
    setAllEquipment(result.data);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    fetchEquipment();
    setDialogOpen(true);
  };

  const openEdit = (m: EquipmentMaintenance) => {
    setEditing(m);
    setForm({
      equipmentId: String(m.equipmentId),
      issue: m.issue,
      cost: String(m.cost),
      maintenanceDate: new Date(m.maintenanceDate).toISOString().slice(0, 10),
      completedDate: m.completedDate
        ? new Date(m.completedDate).toISOString().slice(0, 10)
        : "",
      vendor: m.vendor ?? "",
      status: m.status,
      notes: m.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      equipmentId: Number(form.equipmentId),
      issue: form.issue,
      cost: Number(form.cost) || 0,
      maintenanceDate: form.maintenanceDate,
      completedDate: form.completedDate || undefined,
      vendor: form.vendor || undefined,
      status: form.status,
      notes: form.notes || undefined,
    };
    const result = editing
      ? await updateMaintenance(editing.id, payload as any)
      : await createMaintenance(payload as any);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteMaintenance(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  const statusVariant = (status: EquipmentMaintenanceStatus) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "IN_PROGRESS":
        return "outline";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
    }
  };

  return (
    <RouteGuard permission="equipment.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("maintenance")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="equipment.maintenance">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newMaintenance")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`maintenanceStatus_${s}`)}
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
                <TableHead>{t("issue")}</TableHead>
                <TableHead>{t("vendor")}</TableHead>
                <TableHead>{t("cost")}</TableHead>
                <TableHead>{t("maintenanceDate")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
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
              ) : maintenance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noMaintenance")}
                  </TableCell>
                </TableRow>
              ) : (
                maintenance.map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.equipment?.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {m.issue}
                    </TableCell>
                    <TableCell>{m.vendor || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {m.cost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(m.maintenanceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.status)}>
                        {t(`maintenanceStatus_${m.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can("equipment.maintenance") && (
                            <DropdownMenuItem onClick={() => openEdit(m)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("equipment.maintenance") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(m.id)}
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
                {maintenance.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editMaintenance") : t("newMaintenance")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("equipmentName")}</Label>
              <Select
                value={form.equipmentId}
                onValueChange={(v) => setForm({ ...form, equipmentId: v })}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectEquipment")} />
                </SelectTrigger>
                <SelectContent>
                  {allEquipment.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                      {e.serialNumber ? ` (${e.serialNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue">{t("issue")}</Label>
              <textarea
                id="issue"
                value={form.issue}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                required
                rows={2}
                className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendor">{t("vendor")}</Label>
                <Input
                  id="vendor"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">{t("cost")}</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mdate">{t("maintenanceDate")}</Label>
                <Input
                  id="mdate"
                  type="date"
                  value={form.maintenanceDate}
                  onChange={(e) =>
                    setForm({ ...form, maintenanceDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdate">{t("completedDate")}</Label>
                <Input
                  id="cdate"
                  type="date"
                  value={form.completedDate}
                  onChange={(e) =>
                    setForm({ ...form, completedDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tCommon("status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as EquipmentMaintenanceStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`maintenanceStatus_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={saving || !form.equipmentId || !form.issue}
              >
                {saving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteMaintenance")}
        description={t("deleteMaintenanceConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
