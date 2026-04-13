"use client";

import { useEffect, useState } from "react";
import {
  useEquipment,
  EquipmentAssignment,
  EquipmentAssignmentStatus,
  Equipment,
  Meta,
} from "@/config/equipment/equipment";
import { useEmployees, Employee } from "@/config/employees/employees";
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
  IconArrowBack,
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
  employeeId: string;
  assignedDate: string;
  remarks: string;
};

const emptyForm: FormData = {
  equipmentId: "",
  employeeId: "",
  assignedDate: new Date().toISOString().slice(0, 10),
  remarks: "",
};

export default function EquipmentAssignmentsPage() {
  const {
    getAssignments,
    getEquipment,
    createAssignment,
    returnAssignment,
    deleteAssignment,
  } = useEquipment();
  const { getEmployees } = useEmployees();
  const { can } = usePermission();
  const t = useTranslations("equipment");
  const tCommon = useTranslations("common");

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    EquipmentAssignmentStatus | "ALL"
  >("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [returnId, setReturnId] = useState<number | null>(null);
  const [returning, setReturning] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getAssignments({
      page,
      limit,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    });
    setAssignments(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  const fetchAvailable = async () => {
    const result = await getEquipment({ status: "AVAILABLE", limit: 200 });
    setAvailableEquipment(result.data);
  };

  const fetchEmployees = async () => {
    const result = await getEmployees({ status: "ACTIVE", limit: 500 });
    setEmployees(result.data);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchAvailable();
    fetchEmployees();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    fetchAvailable();
    fetchEmployees();
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const emp = employees.find((e) => String(e.id) === form.employeeId);
    const result = await createAssignment({
      equipmentId: Number(form.equipmentId),
      employeeId: Number(form.employeeId),
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
      assignedDate: form.assignedDate,
      remarks: form.remarks || undefined,
    } as any);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
      fetchAvailable();
    }
  };

  const handleReturn = async () => {
    if (!returnId) return;
    setReturning(true);
    const result = await returnAssignment(returnId);
    setReturning(false);
    setReturnId(null);
    if (result) {
      fetch();
      fetchAvailable();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteAssignment(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  return (
    <RouteGuard permission="equipment.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("assignments")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="equipment.assign">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("assignEquipment")}
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
              <SelectItem value="ASSIGNED">
                {t("assignmentStatus_ASSIGNED")}
              </SelectItem>
              <SelectItem value="RETURNED">
                {t("assignmentStatus_RETURNED")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("equipmentName")}</TableHead>
                <TableHead>{t("serialNumber")}</TableHead>
                <TableHead>{t("employee")}</TableHead>
                <TableHead>{t("assignedDate")}</TableHead>
                <TableHead>{t("returnDate")}</TableHead>
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
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noAssignments")}
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a, idx) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {a.equipment?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.equipment?.serialNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {a.employeeName || `ID: ${a.employeeId}`}
                    </TableCell>
                    <TableCell>
                      {new Date(a.assignedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {a.returnDate
                        ? new Date(a.returnDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "ASSIGNED" ? "default" : "secondary"
                        }
                      >
                        {t(`assignmentStatus_${a.status}`)}
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
                          {can("equipment.assign") &&
                            a.status === "ASSIGNED" && (
                              <DropdownMenuItem
                                onClick={() => setReturnId(a.id)}
                              >
                                <IconArrowBack className="me-2 h-4 w-4 text-green-600" />
                                {t("returnEquipment")}
                              </DropdownMenuItem>
                            )}
                          {can("equipment.assign") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(a.id)}
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
                {assignments.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("assignEquipment")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("equipmentName")}</Label>
              <Select
                value={form.equipmentId}
                onValueChange={(v) => setForm({ ...form, equipmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectEquipment")} />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t("noAvailableEquipment")}
                    </div>
                  ) : (
                    availableEquipment.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                        {e.serialNumber ? ` (${e.serialNumber})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("employee")}</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm({ ...form, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t("noEmployees")}
                    </div>
                  ) : (
                    employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.firstName} {e.lastName}
                        {e.department?.name ? ` — ${e.department.name}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adate">{t("assignedDate")}</Label>
              <Input
                id="adate"
                type="date"
                value={form.assignedDate}
                onChange={(e) =>
                  setForm({ ...form, assignedDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">{t("remarks")}</Label>
              <textarea
                id="remarks"
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                rows={2}
                className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <Button
                type="submit"
                disabled={saving || !form.equipmentId || !form.employeeId}
              >
                {saving ? tCommon("saving") : t("assignEquipment")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!returnId}
        onOpenChange={(open) => !open && setReturnId(null)}
        title={t("returnEquipment")}
        description={t("returnEquipmentConfirm")}
        onConfirm={handleReturn}
        loading={returning}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteAssignment")}
        description={t("deleteAssignmentConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
