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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    return (
      aggregations?.byStatus.find((s) => s.status === status)?.count || 0
    );
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
        <DataTableColumnHeader column={column} title="License No." />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("licenseNumber")}</span>
      ),
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
    },
    {
      accessorKey: "licenseType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("licenseType")}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
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
        <DataTableColumnHeader column={column} title="Province" />
      ),
    },
    {
      accessorKey: "district",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="District" />
      ),
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue Date" />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("issueDate")).toLocaleDateString(),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expiry Date" />
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
        <h1 className="text-2xl font-bold">License Reports</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconLicense className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Licenses</p>
                <p className="text-2xl font-bold">
                  {aggregations?.totalLicenses || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {getStatusCount("ACTIVE")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <IconAlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">
                  {getStatusCount("EXPIRED")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <IconBan className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold">
                  {getStatusCount("SUSPENDED")}
                </p>
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
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.from || ""}
                  onChange={(e) => handleFilterChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.to || ""}
                  onChange={(e) => handleFilterChange("to", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>License Type</Label>
                <Select
                  value={filters.licenseType || "ALL"}
                  onValueChange={(v) => handleFilterChange("licenseType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="SMALL">Small Scale</SelectItem>
                    <SelectItem value="LARGE">Large Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  placeholder="Search company..."
                  value={filters.companyName || ""}
                  onChange={(e) =>
                    handleFilterChange("companyName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input
                  placeholder="Search province..."
                  value={filters.province || ""}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons + View Options */}
        <div className="flex items-center justify-between">
          <PermissionGate permission="report.export">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Export:
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
                    No results found.
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
                Showing{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | Rows per page:
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
                Previous
              </Button>
              <span className="text-sm">
                Page {meta.page} of {meta.totalPages}
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
                Next
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
