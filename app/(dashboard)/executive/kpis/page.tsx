"use client";

import { useEffect, useState } from "react";
import { useExecutive, Kpi, KpiCategory } from "@/config/executive/executive";
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
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

type KpiFormData = {
  key: string;
  value: string;
  year: number;
  category: KpiCategory;
  label: string;
  description: string;
};

const emptyForm: KpiFormData = {
  key: "",
  value: "",
  year: CURRENT_YEAR,
  category: "OTHER",
  label: "",
  description: "",
};

export default function KpisPage() {
  const { getKpis, upsertKpi, deleteKpi } = useExecutive();
  const { can } = usePermission();
  const t = useTranslations("executive");
  const tCommon = useTranslations("common");

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(CURRENT_YEAR);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kpi | null>(null);
  const [form, setForm] = useState<KpiFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getKpis({ year: yearFilter });
    setKpis(result);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [yearFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, year: yearFilter });
    setDialogOpen(true);
  };

  const openEdit = (kpi: Kpi) => {
    setEditing(kpi);
    setForm({
      key: kpi.key,
      value: String(kpi.value),
      year: kpi.year,
      category: kpi.category,
      label: kpi.label ?? "",
      description: kpi.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await upsertKpi({
      key: form.key,
      value: Number(form.value),
      year: form.year,
      category: form.category,
      label: form.label || undefined,
      description: form.description || undefined,
    } as Partial<Kpi>);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteKpi(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  const categoryLabel: Record<KpiCategory, string> = {
    FINANCIAL: t("categoryFinancial"),
    CONTRACT: t("categoryContract"),
    TRAVEL: t("categoryTravel"),
    OPERATIONAL: t("categoryOperational"),
    OTHER: t("categoryOther"),
  };

  return (
    <RouteGuard permission="executive.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">{t("kpis")}</h1>
          <PermissionGate permission="executive.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newKpi")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("year")}:</span>
          <Select
            value={String(yearFilter)}
            onValueChange={(v) => setYearFilter(Number(v))}
          >
            <SelectTrigger className="h-9 w-[120px]">
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

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("kpiKey")}</TableHead>
                <TableHead>{t("kpiLabel")}</TableHead>
                <TableHead>{t("kpiCategory")}</TableHead>
                <TableHead>{t("kpiValue")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : kpis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t("noKpis")}
                  </TableCell>
                </TableRow>
              ) : (
                kpis.map((kpi, idx) => (
                  <TableRow key={kpi.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{kpi.key}</TableCell>
                    <TableCell>{kpi.label || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabel[kpi.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {kpi.value.toLocaleString()}
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
                            <DropdownMenuItem onClick={() => openEdit(kpi)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("executive.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(kpi.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editKpi") : t("newKpi")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="key">{t("kpiKey")}</Label>
                <Input
                  id="key"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="totalRevenue"
                  required
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t("kpiValue")}</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label>{t("kpiCategory")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as KpiCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINANCIAL">
                      {t("categoryFinancial")}
                    </SelectItem>
                    <SelectItem value="CONTRACT">
                      {t("categoryContract")}
                    </SelectItem>
                    <SelectItem value="TRAVEL">
                      {t("categoryTravel")}
                    </SelectItem>
                    <SelectItem value="OPERATIONAL">
                      {t("categoryOperational")}
                    </SelectItem>
                    <SelectItem value="OTHER">
                      {t("categoryOther")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">{t("kpiLabel")}</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Total Revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">{t("kpiDescription")}</Label>
              <textarea
                id="desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
                {saving ? tCommon("saving") : t("upsertKpi")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteKpi")}
        description={t("deleteKpiConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
