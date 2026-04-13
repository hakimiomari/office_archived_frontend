"use client";

import { useEffect, useState } from "react";
import { useExecutive, ContractsSummary } from "@/config/executive/executive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - i);

type FormData = {
  year: number;
  totalContracts: string;
  activeContracts: string;
  suspendedContracts: string;
  cancelledContracts: string;
  notes: string;
};

const emptyForm: FormData = {
  year: CURRENT_YEAR,
  totalContracts: "0",
  activeContracts: "0",
  suspendedContracts: "0",
  cancelledContracts: "0",
  notes: "",
};

export default function ContractsSummaryPage() {
  const {
    getContractsSummaries,
    upsertContractsSummary,
    deleteContractsSummary,
  } = useExecutive();
  const { can } = usePermission();
  const t = useTranslations("executive");
  const tCommon = useTranslations("common");

  const [summaries, setSummaries] = useState<ContractsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContractsSummary | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getContractsSummaries();
    setSummaries(result);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: ContractsSummary) => {
    setEditing(s);
    setForm({
      year: s.year,
      totalContracts: String(s.totalContracts),
      activeContracts: String(s.activeContracts),
      suspendedContracts: String(s.suspendedContracts),
      cancelledContracts: String(s.cancelledContracts),
      notes: s.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await upsertContractsSummary({
      year: form.year,
      totalContracts: Number(form.totalContracts),
      activeContracts: Number(form.activeContracts),
      suspendedContracts: Number(form.suspendedContracts),
      cancelledContracts: Number(form.cancelledContracts),
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteContractsSummary(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  return (
    <RouteGuard permission="executive.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">{t("contractsSummary")}</h1>
          <PermissionGate permission="executive.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newContractsSummary")}
            </Button>
          </PermissionGate>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("year")}</TableHead>
                <TableHead>{t("totalContracts")}</TableHead>
                <TableHead>{t("activeContracts")}</TableHead>
                <TableHead>{t("suspendedContracts")}</TableHead>
                <TableHead>{t("cancelledContracts")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[80px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t("noContractsSummary")}
                  </TableCell>
                </TableRow>
              ) : (
                summaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.year}</TableCell>
                    <TableCell>{s.totalContracts}</TableCell>
                    <TableCell className="text-green-600">
                      {s.activeContracts}
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      {s.suspendedContracts}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {s.cancelledContracts}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can("executive.update") && (
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("executive.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(s.id)}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editContractsSummary") : t("newContractsSummary")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("year")}</Label>
              <Select
                value={String(form.year)}
                onValueChange={(v) => setForm({ ...form, year: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total">{t("totalContracts")}</Label>
                <Input
                  id="total"
                  type="number"
                  min="0"
                  value={form.totalContracts}
                  onChange={(e) =>
                    setForm({ ...form, totalContracts: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="active">{t("activeContracts")}</Label>
                <Input
                  id="active"
                  type="number"
                  min="0"
                  value={form.activeContracts}
                  onChange={(e) =>
                    setForm({ ...form, activeContracts: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suspended">{t("suspendedContracts")}</Label>
                <Input
                  id="suspended"
                  type="number"
                  min="0"
                  value={form.suspendedContracts}
                  onChange={(e) =>
                    setForm({ ...form, suspendedContracts: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancelled">{t("cancelledContracts")}</Label>
                <Input
                  id="cancelled"
                  type="number"
                  min="0"
                  value={form.cancelledContracts}
                  onChange={(e) =>
                    setForm({ ...form, cancelledContracts: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
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
        title={t("deleteContractsSummary")}
        description={t("deleteContractsSummaryConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
