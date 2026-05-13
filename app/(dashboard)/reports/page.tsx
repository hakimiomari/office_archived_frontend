"use client";

import { useEffect, useState } from "react";
import { useReports, ReportFilters } from "@/config/license/reports";
import { useLicense, LicenseType } from "@/contexts/LicenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileTypeCsv,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconLicense,
  IconCheck,
  IconAlertTriangle,
  IconBan,
} from "@tabler/icons-react";
import { LicenseStatusChart } from "@/components/reports/license-status-chart";
import { LicenseTypeChart } from "@/components/reports/license-type-chart";
import { ProvinceChart } from "@/components/reports/province-chart";
import { MonthlyTrendChart } from "@/components/reports/monthly-trend-chart";
import { PermissionGate } from "@/components/permission-gate";
import { RouteGuard } from "@/components/route-guard";
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

type ChartData = {
  byProvince: { province: string; count: number }[];
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  monthlyTrend: {
    month: string;
    small: number;
    large: number;
    total: number;
  }[];
} | null;

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

export default function ReportsPage() {
  const { getLicenseReport, exportReport, getChartData } = useReports();
  const { licenses, meta, aggregations, loading } = useLicense();
  const [chartData, setChartData] = useState<ChartData>(null);
  const t = useTranslations("reports");
  const tLicenses = useTranslations("licenses");
  const tCommon = useTranslations("common");
  const tProvinces = useTranslations("provinces");

  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    limit: 10,
  });

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const fetchChartData = async (f: ReportFilters) => {
    const data = await getChartData(f);
    setChartData(data);
  };

  useEffect(() => {
    getLicenseReport(filters);
    fetchChartData(filters);
  }, [filters.page]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "ALL" ? undefined : value,
    }));
  };

  const applyFilters = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    getLicenseReport(updated);
    fetchChartData(updated);
  };

  const resetFilters = () => {
    const reset: ReportFilters = { page: 1, limit: filters.limit || 10 };
    setFilters(reset);
    getLicenseReport(reset);
    fetchChartData(reset);
  };

  const getStatusCount = (status: string) => {
    return aggregations?.byStatus.find((s) => s.status === status)?.count || 0;
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
        <DataTableColumnHeader
          column={column}
          title={tLicenses("licenseNumber")}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("licenseNumber")}</span>
      ),
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tLicenses("company")} />
      ),
    },
    {
      accessorKey: "licenseType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tLicenses("type")} />
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
        <DataTableColumnHeader column={column} title={tLicenses("province")} />
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
      accessorKey: "district",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tLicenses("district")} />
      ),
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tLicenses("issueDate")} />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("issueDate")).toLocaleDateString(),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={tLicenses("expiryDate")}
        />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("expiryDate")).toLocaleDateString(),
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
    <RouteGuard permission="report.view">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {meta && (
            <Badge variant="default" className="text-sm">
              {meta.total}
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconLicense className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalLicenses")}
                </p>
                {aggregations?.totalLicenses || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("activeLicenses")}
                </p>
                {getStatusCount("ACTIVE")}
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
                  {t("expiredLicenses")}
                </p>
                {getStatusCount("EXPIRED")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <IconBan className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("suspendedLicenses")}
                </p>
                {getStatusCount("SUSPENDED")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {chartData && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <LicenseStatusChart data={chartData.byStatus} />
              <LicenseTypeChart data={chartData.byType} />
              <ProvinceChart data={chartData.byProvince} />
            </div>
            {chartData.monthlyTrend.length > 0 && (
              <MonthlyTrendChart data={chartData.monthlyTrend} />
            )}
          </>
        )}

        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              {t("filters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-2">
                <Label>{t("fromDate")}</Label>
                <Input
                  type="date"
                  value={filters.from || ""}
                  onChange={(e) => handleFilterChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("toDate")}</Label>
                <Input
                  type="date"
                  value={filters.to || ""}
                  onChange={(e) => handleFilterChange("to", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("licenseType")}</Label>
                <Select
                  value={filters.licenseType || "ALL"}
                  onValueChange={(v) => handleFilterChange("licenseType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("allTypes")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("allTypes")}</SelectItem>
                    <SelectItem value="SMALL">
                      {tLicenses("smallScale")}
                    </SelectItem>
                    <SelectItem value="LARGE">
                      {tLicenses("largeScale")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("status")}</Label>
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                    <SelectItem value="ACTIVE">
                      {tLicenses("active")}
                    </SelectItem>
                    <SelectItem value="EXPIRED">
                      {tLicenses("expired")}
                    </SelectItem>
                    <SelectItem value="SUSPENDED">
                      {tLicenses("suspended")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("companyName")}</Label>
                <Input
                  placeholder={t("searchCompany")}
                  value={filters.companyName || ""}
                  onChange={(e) =>
                    handleFilterChange("companyName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("province")}</Label>
                <ProvinceSelect
                  value={filters.province || ""}
                  onValueChange={(v) => handleFilterChange("province", v)}
                  includeAll
                  allLabel={tCommon("all")}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={applyFilters}>{t("applyFilters")}</Button>
              <Button variant="outline" onClick={resetFilters}>
                {tCommon("reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons + View Options */}
        <div className="flex items-center justify-between">
          <PermissionGate permission="report.export">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t("export")}:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport(filters, "pdf")}
              >
                <IconFileTypePdf className="mr-2 h-4 w-4 text-red-600" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport(filters, "excel")}
              >
                <IconFileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport(filters, "csv")}
              >
                <IconFileTypeCsv className="mr-2 h-4 w-4 text-blue-600" />
                CSV
              </Button>
            </div>
          </PermissionGate>
          <DataTableViewOptions table={table} />
        </div>

        {/* Report Table */}
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
                            header.getContext(),
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
                    {t("noReportResults")}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
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
                {tCommon("to")} {Math.min(meta.page * meta.limit, meta.total)}{" "}
                {tCommon("of")} {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | {tCommon("rowsPerPage")}:
                </span>
                <Select
                  value={`${filters.limit || 10}`}
                  onValueChange={(value) => {
                    const updated = {
                      ...filters,
                      limit: Number(value),
                      page: 1,
                    };
                    setFilters(updated);
                    getLicenseReport(updated);
                    fetchChartData(updated);
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
                disabled={(filters.page || 1) <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page || 1) - 1,
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
                disabled={(filters.page || 1) >= meta.totalPages}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page || 1) + 1,
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
    </RouteGuard>
  );
}
