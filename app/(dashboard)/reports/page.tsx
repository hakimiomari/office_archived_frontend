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

type ChartData = {
  byProvince: { province: string; count: number }[];
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  monthlyTrend: { month: string; small: number; large: number; total: number }[];
} | null;

export default function ReportsPage() {
  const { getLicenseReport, exportReport, getChartData } = useReports();
  const { licenses, meta, aggregations, loading } = useLicense();
  const [chartData, setChartData] = useState<ChartData>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    limit: 10,
  });

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

  const getStatusCount = (status: string) => {
    return (
      aggregations?.byStatus.find((s) => s.status === status)?.count || 0
    );
  };

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
              <p className="text-2xl font-bold">{getStatusCount("ACTIVE")}</p>
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
              <p className="text-2xl font-bold">{getStatusCount("EXPIRED")}</p>
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

      {/* Export Buttons */}
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

      {/* Report Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">#</TableHead>
              <TableHead className="px-4 py-2">License No.</TableHead>
              <TableHead className="px-4 py-2">Company</TableHead>
              <TableHead className="px-4 py-2">Type</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Province</TableHead>
              <TableHead className="px-4 py-2">District</TableHead>
              <TableHead className="px-4 py-2">Issue Date</TableHead>
              <TableHead className="px-4 py-2">Expiry Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((lic: LicenseType, index: number) => (
                <TableRow key={lic.id}>
                  <TableCell className="px-4 py-2">
                    {((meta?.page || 1) - 1) * (meta?.limit || 10) + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    {lic.licenseNumber}
                  </TableCell>
                  <TableCell className="px-4 py-2">{lic.companyName}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline">{lic.licenseType}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant={statusColor(lic.status)}>
                      {lic.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">{lic.province}</TableCell>
                  <TableCell className="px-4 py-2">{lic.district}</TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(lic.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(lic.expiryDate).toLocaleDateString()}
                  </TableCell>
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
              Showing {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">| Rows per page:</span>
              <Select
                value={`${filters.limit || 10}`}
                onValueChange={(value) => {
                  const updated = { ...filters, limit: Number(value), page: 1 };
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
