"use client";

import { useEffect, useState } from "react";
import { useLicenses } from "@/config/license/license";
import { useLicense, LicenseType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  IconEye,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/app/(dashboard)/office-archive/data-table-components/data-table-column-header";
import { DataTableViewOptions } from "@/app/(dashboard)/office-archive/data-table-components/data-table-view-options";
import { useTranslations } from "next-intl";
import { ProvinceSelect } from "@/components/province-select";
import { provinceKey } from "@/lib/constants/provinces";

type LicenseFormData = {
  licenseNumber: string;
  companyName: string;
  licenseType: "SMALL" | "LARGE";
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  province: string;
  district: string;
};

const emptyForm: LicenseFormData = {
  licenseNumber: "",
  companyName: "",
  licenseType: "SMALL",
  issueDate: "",
  expiryDate: "",
  status: "ACTIVE",
  province: "",
  district: "",
};

const statusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "EXPIRED":
      return "destructive";
    case "SUSPENDED":
      return "secondary";
    default:
      return "outline";
  }
};

export default function LicensesPage() {
  const { getLicenses, getLicense, createLicense, updateLicense, deleteLicense } =
    useLicenses();
  const { licenses, meta, loading } = useLicense();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();
  const t = useTranslations("licenses");
  const tCommon = useTranslations("common");
  const tProvinces = useTranslations("provinces");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseType | null>(null);
  const [form, setForm] = useState<LicenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getLicenses(page, limit, search);
  }, [page, limit]);

  const handleSearch = () => {
    setPage(1);
    getLicenses(1, limit, search);
  };

  const openCreate = () => {
    setEditingLicense(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const lic = await getLicense(id);
    if (lic) {
      setEditingLicense(lic);
      setForm({
        licenseNumber: lic.licenseNumber,
        companyName: lic.companyName,
        licenseType: lic.licenseType,
        issueDate: new Date(lic.issueDate).toISOString().split("T")[0],
        expiryDate: new Date(lic.expiryDate).toISOString().split("T")[0],
        status: lic.status,
        province: lic.province,
        district: lic.district,
      });
      setDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (editingLicense) {
      result = await updateLicense(editingLicense.id, form);
    } else {
      result = await createLicense(form);
    }
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      getLicenses(page, limit, search);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteLicense(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) getLicenses(page, limit, search);
  };

  const handleChange = (field: keyof LicenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const columns: ColumnDef<LicenseType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "licenseNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("licenseNumber")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("licenseNumber")}</span>
      ),
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("company")} />
      ),
    },
    {
      accessorKey: "licenseType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("type")} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("licenseType")}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tCommon("status")} />
      ),
      cell: ({ row }) => (
        <Badge variant={statusColor(row.getValue("status"))}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "province",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("province")} />
      ),
      cell: ({ row }) => {
        const provinceValue = row.getValue("province") as string;
        try {
          return tProvinces(provinceKey(provinceValue) as any);
        } catch {
          return provinceValue;
        }
      },
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("issueDate")} />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("issueDate")).toLocaleDateString(),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("expiryDate")} />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("expiryDate")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: tCommon("actions"),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const lic = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => changeRoute(`/licenses/${lic.id}`)}
              >
                <IconEye className="mr-2 h-4 w-4" />
                {tCommon("view")}
              </DropdownMenuItem>
              {can("license.update") && (
                <DropdownMenuItem onClick={() => openEdit(lic.id)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
              )}
              {can("license.delete") && (
                <DropdownMenuItem
                  onClick={() => setDeleteId(lic.id)}
                  className="text-red-600"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: licenses,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <RouteGuard permission="license.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="license.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              {t("newLicense")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button variant="outline" onClick={handleSearch}>
              {tCommon("search")}
            </Button>
          </div>
          <DataTableViewOptions table={table} />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {table.getVisibleFlatColumns().map((col) => (
                      <TableCell key={col.id} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleFlatColumns().length}
                    className="h-24 text-center"
                  >
                    {t("noLicenses")}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {tCommon("showing")}{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} {tCommon("to")}{" "}
                {Math.min(meta.page * meta.limit, meta.total)} {tCommon("of")} {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | {tCommon("rowsPerPage")}:
                </span>
                <Select
                  value={`${limit}`}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100, 500, 1000].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon("next")}
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit License Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? t("editLicense") : t("createLicense")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t("licenseNumber")}</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => handleChange("licenseNumber", e.target.value)}
                  placeholder={t("licenseNumberPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">{t("company")}</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder={t("companyNamePlaceholder")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("licenseType")}</Label>
                <Select
                  value={form.licenseType}
                  onValueChange={(v) => handleChange("licenseType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">{t("smallScale")}</SelectItem>
                    <SelectItem value="LARGE">{t("largeScale")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tCommon("status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                    <SelectItem value="EXPIRED">{t("expired")}</SelectItem>
                    <SelectItem value="SUSPENDED">{t("suspended")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">{t("issueDate")}</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => handleChange("issueDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">{t("expiryDate")}</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="province">{t("province")}</Label>
                <ProvinceSelect
                  id="province"
                  value={form.province}
                  onValueChange={(v) => handleChange("province", v)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">{t("district")}</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder={t("districtPlaceholder")}
                  required
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
              <Button type="submit" disabled={saving}>
                {saving
                  ? tCommon("saving")
                  : editingLicense
                    ? t("updateLicense")
                    : t("createLicense")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteLicense")}
        description={t("deleteConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
