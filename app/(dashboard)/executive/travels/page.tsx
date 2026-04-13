"use client";

import { useEffect, useState } from "react";
import {
  useExecutive,
  MinisterTravel,
  TravelType,
  Meta,
} from "@/config/executive/executive";
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
  type: TravelType;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  cost: string;
};

const emptyForm: FormData = {
  type: "DOMESTIC",
  destination: "",
  purpose: "",
  startDate: "",
  endDate: "",
  cost: "0",
};

export default function TravelsPage() {
  const { getTravels, createTravel, updateTravel, deleteTravel } = useExecutive();
  const { can } = usePermission();
  const t = useTranslations("executive");
  const tCommon = useTranslations("common");

  const [travels, setTravels] = useState<MinisterTravel[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TravelType | "ALL">("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");

  // Build list of years: current year + 9 previous years
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MinisterTravel | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getTravels({
      page,
      limit,
      search: search || undefined,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
      year: yearFilter !== "ALL" ? Number(yearFilter) : undefined,
    });
    setTravels(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, typeFilter, yearFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const openEdit = (travel: MinisterTravel) => {
    setEditing(travel);
    setForm({
      type: travel.type,
      destination: travel.destination,
      purpose: travel.purpose ?? "",
      startDate: new Date(travel.startDate).toISOString().slice(0, 10),
      endDate: travel.endDate
        ? new Date(travel.endDate).toISOString().slice(0, 10)
        : "",
      cost: String(travel.cost),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: form.type,
      destination: form.destination,
      purpose: form.purpose || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      cost: Number(form.cost) || 0,
    };
    const result = editing
      ? await updateTravel(editing.id, payload as any)
      : await createTravel(payload as any);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteTravel(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  return (
    <RouteGuard permission="executive.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("ministerTravels")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="executive.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newTravel")}
            </Button>
          </PermissionGate>
        </div>

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
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allTypes")}</SelectItem>
              <SelectItem value="DOMESTIC">{t("domesticTravels")}</SelectItem>
              <SelectItem value="INTERNATIONAL">
                {t("internationalTravels")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={yearFilter}
            onValueChange={(v) => {
              setYearFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder={t("allYears")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allYears")}</SelectItem>
              {yearOptions.map((y) => (
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
                <TableHead>{t("travelType")}</TableHead>
                <TableHead>{t("destination")}</TableHead>
                <TableHead>{t("purpose")}</TableHead>
                <TableHead>{t("startDate")}</TableHead>
                <TableHead>{t("endDate")}</TableHead>
                <TableHead>{t("cost")}</TableHead>
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
              ) : travels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noTravels")}
                  </TableCell>
                </TableRow>
              ) : (
                travels.map((travel, idx) => (
                  <TableRow key={travel.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          travel.type === "INTERNATIONAL" ? "default" : "secondary"
                        }
                      >
                        {travel.type === "DOMESTIC"
                          ? t("domesticTravels")
                          : t("internationalTravels")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {travel.destination}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {travel.purpose || "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(travel.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {travel.endDate
                        ? new Date(travel.endDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {travel.cost.toLocaleString()}
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
                            <DropdownMenuItem onClick={() => openEdit(travel)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("executive.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(travel.id)}
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
                {travels.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
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
              {editing ? t("editTravel") : t("newTravel")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("travelType")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TravelType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMESTIC">{t("domesticTravels")}</SelectItem>
                  <SelectItem value="INTERNATIONAL">
                    {t("internationalTravels")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dest">{t("destination")}</Label>
              <Input
                id="dest"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">{t("purpose")}</Label>
              <textarea
                id="purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                rows={2}
                className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">{t("startDate")}</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">{t("endDate")}</Label>
                <Input
                  id="end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
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
        title={t("deleteTravel")}
        description={t("deleteTravelConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
