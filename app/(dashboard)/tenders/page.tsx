"use client";

import { useEffect, useState } from "react";
import {
  useTenders,
  Tender,
  TenderMeta,
  TenderFilters,
  TenderType,
  TenderSector,
  TenderStatus,
  TenderLanguage,
} from "@/config/tender/tender";
import { nextRoute } from "@/lib/route";
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
  IconEye,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileTypeCsv,
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

type TenderFormData = {
  title: string;
  description: string;
  sourceUrl: string;
  referenceNo: string;
  publishDate: string;
  closingDate: string;
  sector: TenderSector;
  type: TenderType;
  status: TenderStatus;
  projectName: string;
  location: string;
};

const emptyForm: TenderFormData = {
  title: "",
  description: "",
  sourceUrl: "",
  referenceNo: "",
  publishDate: "",
  closingDate: "",
  sector: "OTHER",
  type: "TENDER",
  status: "OPEN",
  projectName: "",
  location: "",
};

const statusVariant = (status: TenderStatus) => {
  switch (status) {
    case "OPEN":
      return "default";
    case "CLOSED":
      return "secondary";
    default:
      return "outline";
  }
};

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default function TendersPage() {
  const {
    getTenders,
    getTender,
    createTender,
    updateTender,
    deleteTender,
    exportTenders,
  } = useTenders();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();
  const t = useTranslations("tenders");
  const tCommon = useTranslations("common");

  // Data state
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [meta, setMeta] = useState<TenderMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters/pagination
  const [filters, setFilters] = useState<TenderFilters>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [form, setForm] = useState<TenderFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTenders = async (override?: TenderFilters) => {
    setLoading(true);
    const result = await getTenders(override ?? filters);
    setTenders(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetchTenders();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.sector,
    filters.type,
    filters.language,
  ]);

  const handleSearch = () => {
    const updated = { ...filters, search, page: 1 };
    setFilters(updated);
    fetchTenders(updated);
  };

  const handleFilterChange = (key: keyof TenderFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "ALL" ? undefined : (value as any),
      page: 1,
    }));
  };

  const openCreate = () => {
    setEditingTender(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const tender = await getTender(id);
    if (tender) {
      setEditingTender(tender);
      setForm({
        title: tender.title,
        description: tender.description ?? "",
        sourceUrl: tender.sourceUrl,
        referenceNo: tender.referenceNo ?? "",
        publishDate: tender.publishDate
          ? new Date(tender.publishDate).toISOString().split("T")[0]
          : "",
        closingDate: tender.closingDate
          ? new Date(tender.closingDate).toISOString().split("T")[0]
          : "",
        sector: tender.sector,
        type: tender.type,
        status: tender.status,
        projectName: tender.projectName ?? "",
        location: tender.location ?? "",
      });
      setDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      title: form.title,
      sourceUrl: form.sourceUrl,
      sector: form.sector,
      type: form.type,
      status: form.status,
    };
    if (form.description) payload.description = form.description;
    if (form.referenceNo) payload.referenceNo = form.referenceNo;
    if (form.publishDate) payload.publishDate = form.publishDate;
    if (form.closingDate) payload.closingDate = form.closingDate;
    if (form.projectName) payload.projectName = form.projectName;
    if (form.location) payload.location = form.location;

    let result;
    if (editingTender) {
      result = await updateTender(editingTender.id, payload);
    } else {
      result = await createTender(payload);
    }
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetchTenders();
    }
  };

  const handleChange = (field: keyof TenderFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteTender(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) fetchTenders();
  };

  const columns: ColumnDef<Tender>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("tenderTitle")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium line-clamp-2 max-w-[260px] block">
          {row.getValue("title")}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("type")} />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as TenderType;
        const labelMap: Record<TenderType, string> = {
          TENDER: t("typeTender"),
          CONSULTING: t("typeConsulting"),
          AUCTION: t("typeAuction"),
          NOTICE: t("typeNotice"),
          ANNOUNCEMENT: t("typeAnnouncement"),
          OTHER: t("typeOther"),
        };
        return <Badge variant="outline">{labelMap[type]}</Badge>;
      },
    },
    {
      accessorKey: "sector",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("sector")} />
      ),
      cell: ({ row }) => {
        const sector = row.getValue("sector") as TenderSector;
        const labelMap = {
          MINING: t("sectorMining"),
          OIL: t("sectorOil"),
          GAS: t("sectorGas"),
          CONSULTING: t("sectorConsulting"),
          OTHER: t("sectorOther"),
        };
        return <Badge variant="secondary">{labelMap[sector]}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tCommon("status")} />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as TenderStatus;
        return (
          <Badge variant={statusVariant(status)}>
            {status === "OPEN" ? t("open") : t("closed")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "language",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("language")} />
      ),
      cell: ({ row }) => {
        const lang = row.getValue("language") as TenderLanguage;
        const labelMap: Record<TenderLanguage, string> = {
          EN: t("langEn"),
          PS: t("langPs"),
          FA: t("langFa"),
        };
        return <Badge variant="outline">{labelMap[lang]}</Badge>;
      },
    },
    {
      accessorKey: "closingDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("closingDate")} />
      ),
      cell: ({ row }) => {
        const value = row.getValue("closingDate") as string | null;
        if (!value) return <span className="text-muted-foreground">—</span>;
        const days = daysUntil(value);
        const dateStr = new Date(value).toLocaleDateString();
        const isUrgent = days !== null && days >= 0 && days <= 7;
        const isExpired = days !== null && days < 0;
        return (
          <div className="flex flex-col">
            <span>{dateStr}</span>
            {isExpired ? (
              <span className="text-xs text-destructive">{t("expired")}</span>
            ) : isUrgent ? (
              <span className="text-xs text-orange-600">
                {t("daysLeft", { days: days! })}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "publishDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("publishDate")} />
      ),
      cell: ({ row }) => {
        const value = row.getValue("publishDate") as string | null;
        return value ? (
          new Date(value).toLocaleDateString()
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: tCommon("actions"),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const tender = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => changeRoute(`/tenders/${tender.id}`)}
              >
                <IconEye className="me-2 h-4 w-4" />
                {tCommon("view")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(tender.sourceUrl, "_blank")}
              >
                <IconExternalLink className="me-2 h-4 w-4" />
                {t("viewSource")}
              </DropdownMenuItem>
              {can("tender.update") && (
                <DropdownMenuItem onClick={() => openEdit(tender.id)}>
                  <IconEdit className="me-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
              )}
              {can("tender.delete") && (
                <DropdownMenuItem
                  onClick={() => setDeleteId(tender.id)}
                  className="text-red-600"
                >
                  <IconTrash className="me-2 h-4 w-4" />
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
    data: tenders,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <RouteGuard permission="tender.read">
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t("export")}:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders(filters, "pdf")}
            >
              <IconFileTypePdf className="me-2 h-4 w-4 text-red-600" />
              {t("exportPdf")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders(filters, "excel")}
            >
              <IconFileSpreadsheet className="me-2 h-4 w-4 text-green-600" />
              {t("exportExcel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders(filters, "csv")}
            >
              <IconFileTypeCsv className="me-2 h-4 w-4 text-blue-600" />
              {t("exportCsv")}
            </Button>
            <PermissionGate permission="tender.create">
              <Button onClick={openCreate}>
                <IconPlus className="me-2 h-4 w-4" />
                {t("newTender")}
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-1 min-w-[260px] items-center gap-2">
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

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.status || "ALL"}
              onValueChange={(v) => handleFilterChange("status", v)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                <SelectItem value="OPEN">{t("open")}</SelectItem>
                <SelectItem value="CLOSED">{t("closed")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sector || "ALL"}
              onValueChange={(v) => handleFilterChange("sector", v)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t("allSectors")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allSectors")}</SelectItem>
                <SelectItem value="MINING">{t("sectorMining")}</SelectItem>
                <SelectItem value="OIL">{t("sectorOil")}</SelectItem>
                <SelectItem value="GAS">{t("sectorGas")}</SelectItem>
                <SelectItem value="CONSULTING">
                  {t("sectorConsulting")}
                </SelectItem>
                <SelectItem value="OTHER">{t("sectorOther")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type || "ALL"}
              onValueChange={(v) => handleFilterChange("type", v)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allTypes")}</SelectItem>
                <SelectItem value="TENDER">{t("typeTender")}</SelectItem>
                <SelectItem value="CONSULTING">
                  {t("typeConsulting")}
                </SelectItem>
                <SelectItem value="AUCTION">{t("typeAuction")}</SelectItem>
                <SelectItem value="NOTICE">{t("typeNotice")}</SelectItem>
                <SelectItem value="ANNOUNCEMENT">
                  {t("typeAnnouncement")}
                </SelectItem>
                <SelectItem value="OTHER">{t("typeOther")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.language || "ALL"}
              onValueChange={(v) => handleFilterChange("language", v)}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder={t("allLanguages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allLanguages")}</SelectItem>
                <SelectItem value="EN">{t("langEn")}</SelectItem>
                <SelectItem value="PS">{t("langPs")}</SelectItem>
                <SelectItem value="FA">{t("langFa")}</SelectItem>
              </SelectContent>
            </Select>

            <DataTableViewOptions table={table} />
          </div>
        </div>

        {/* Table */}
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
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {table.getVisibleFlatColumns().map((col) => (
                      <TableCell key={col.id} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
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
                    {t("noTenders")}
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

        {/* Pagination */}
        {meta && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {tCommon("showing")}{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")}{" "}
                {Math.min(meta.page * meta.limit, meta.total)} {tCommon("of")}{" "}
                {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | {tCommon("rowsPerPage")}:
                </span>
                <Select
                  value={`${filters.limit ?? 10}`}
                  onValueChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      limit: Number(value),
                      page: 1,
                    }));
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
                disabled={(filters.page ?? 1) <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page ?? 1) - 1,
                  }))
                }
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
                disabled={(filters.page ?? 1) >= meta.totalPages}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page ?? 1) + 1,
                  }))
                }
              >
                {tCommon("next")}
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTender ? t("editTender") : t("createTender")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("tenderTitle")}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">{t("sourceUrl")}</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={form.sourceUrl}
                onChange={(e) => handleChange("sourceUrl", e.target.value)}
                placeholder="https://momp.gov.af/tender-..."
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => handleChange("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENDER">{t("typeTender")}</SelectItem>
                    <SelectItem value="CONSULTING">
                      {t("typeConsulting")}
                    </SelectItem>
                    <SelectItem value="AUCTION">{t("typeAuction")}</SelectItem>
                    <SelectItem value="NOTICE">{t("typeNotice")}</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">
                      {t("typeAnnouncement")}
                    </SelectItem>
                    <SelectItem value="OTHER">{t("typeOther")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("sector")}</Label>
                <Select
                  value={form.sector}
                  onValueChange={(v) => handleChange("sector", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINING">{t("sectorMining")}</SelectItem>
                    <SelectItem value="OIL">{t("sectorOil")}</SelectItem>
                    <SelectItem value="GAS">{t("sectorGas")}</SelectItem>
                    <SelectItem value="CONSULTING">
                      {t("sectorConsulting")}
                    </SelectItem>
                    <SelectItem value="OTHER">{t("sectorOther")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <SelectItem value="OPEN">{t("open")}</SelectItem>
                    <SelectItem value="CLOSED">{t("closed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNo">{t("referenceNo")}</Label>
                <Input
                  id="referenceNo"
                  value={form.referenceNo}
                  onChange={(e) => handleChange("referenceNo", e.target.value)}
                  placeholder="MOMP-2026-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publishDate">{t("publishDate")}</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => handleChange("publishDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingDate">{t("closingDate")}</Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={form.closingDate}
                  onChange={(e) => handleChange("closingDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">{t("projectName")}</Label>
                <Input
                  id="projectName"
                  value={form.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("location")}</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="border-input bg-background ring-offset-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                {saving
                  ? tCommon("saving")
                  : editingTender
                    ? t("updateTender")
                    : t("createTender")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteTender")}
        description={t("deleteConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
