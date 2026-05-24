"use client";

import { useEffect, useState } from "react";
import {
  useAuctionReports,
  AuctionReportFilters,
  AuctionReportAggregations,
  AuctionChartData,
  AuctionReportMeta,
} from "@/config/auction/reports";
import { useMineralTypes } from "@/config/mineral/mineral";
import { useProvinces } from "@/config/province/province";
import { AuctionType, MineralType, ProvinceRef } from "@/contexts/LicenseContext";
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
  IconGavel,
  IconCoin,
  IconReceiptTax,
} from "@tabler/icons-react";
import { AuctionMonthlyChart } from "@/components/reports/auction-monthly-chart";
import { AuctionYearlyChart } from "@/components/reports/auction-yearly-chart";
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

const ALL = "__all__";
const currencyLabel = (c: string) => (c === "USD" ? "$" : c);
const fmt = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString();

// Year options: current year and the previous 9 years (10 total).
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export default function AuctionReportsPage() {
  const { getAuctionReport, getAuctionChartData, exportAuctionReport } =
    useAuctionReports();
  const { getMineralTypes } = useMineralTypes();
  const { getProvinces } = useProvinces();

  const [filters, setFilters] = useState<AuctionReportFilters>({
    page: 1,
    limit: 10,
  });
  const [data, setData] = useState<AuctionType[]>([]);
  const [meta, setMeta] = useState<AuctionReportMeta | null>(null);
  const [aggregations, setAggregations] =
    useState<AuctionReportAggregations | null>(null);
  const [charts, setCharts] = useState<AuctionChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const [minerals, setMinerals] = useState<MineralType[]>([]);
  const [provinces, setProvinces] = useState<ProvinceRef[]>([]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const fetchAll = async (f: AuctionReportFilters) => {
    setLoading(true);
    const [report, chartData] = await Promise.all([
      getAuctionReport(f),
      getAuctionChartData(f),
    ]);
    setData(report.data);
    setMeta(report.meta);
    setAggregations(report.aggregations);
    setCharts(chartData);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll(filters);
    getMineralTypes(1, 500).then(({ data }) => setMinerals(data));
    getProvinces().then(setProvinces);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  const handleFilterChange = <K extends keyof AuctionReportFilters>(
    key: K,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        value === ALL || value === ""
          ? undefined
          : key === "provinceId"
            ? (Number(value) as any)
            : (value as any),
    }));
  };

  const applyFilters = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    fetchAll(updated);
  };

  const resetFilters = () => {
    const reset: AuctionReportFilters = { page: 1, limit: filters.limit || 10 };
    setFilters(reset);
    fetchAll(reset);
  };

  // Year selector — sets from/to to the full year range so the existing
  // backend `auctionDate` window filter handles it.
  const selectedYear = (() => {
    if (!filters.from || !filters.to) return ALL;
    const fy = new Date(filters.from).getFullYear();
    const ty = new Date(filters.to).getFullYear();
    if (
      fy === ty &&
      filters.from.startsWith(`${fy}-01-01`) &&
      filters.to.startsWith(`${fy}-12-31`)
    ) {
      return String(fy);
    }
    return ALL;
  })();

  const handleYearChange = (value: string) => {
    const updated: AuctionReportFilters = { ...filters, page: 1 };
    if (value === ALL) {
      updated.from = undefined;
      updated.to = undefined;
    } else {
      updated.from = `${value}-01-01`;
      updated.to = `${value}-12-31`;
    }
    setFilters(updated);
    fetchAll(updated);
  };

  const columns: ColumnDef<AuctionType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "auctionDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) =>
        row.original.auctionDate
          ? new Date(row.original.auctionDate).toLocaleDateString()
          : "—",
    },
    {
      id: "mineral",
      accessorFn: (a) => a.mineralType?.name ?? a.mieralTypeId,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mineral" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.mineralType?.name ?? "—"}</Badge>
      ),
    },
    {
      id: "province",
      accessorFn: (a) => a.province?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Province" />
      ),
      cell: ({ row }) => row.original.province?.name ?? "—",
    },
    {
      accessorKey: "round",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Round" />
      ),
      cell: ({ row }) => row.original.round ?? "—",
    },
    {
      id: "mass",
      accessorFn: (a) => `${a.mass} ${a.unit}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mass" />
      ),
      cell: ({ row }) => `${row.original.mass} ${row.original.unit}`.trim(),
    },
    {
      id: "unitPrice",
      accessorFn: (a) => `${a.unitPrice} ${currencyLabel(a.priceCurrency)}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit Price" />
      ),
      cell: ({ row }) =>
        `${row.original.unitPrice} ${currencyLabel(row.original.priceCurrency)}`,
    },
    {
      accessorKey: "royalty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Royalty" />
      ),
      cell: ({ row }) =>
        row.original.royalty != null ? `${row.original.royalty}%` : "—",
    },
  ];

  const table = useReactTable({
    data,
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Auction Reports</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All years</SelectItem>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards: total + totals/royalty per currency */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <IconGavel className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Auctions</p>
                <p className="text-xl font-bold">
                  {aggregations?.totalAuctions ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <IconCoin className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Totals</p>
                {!aggregations ||
                aggregations.totalsByCurrency.length === 0 ? (
                  <p className="text-xl font-bold">—</p>
                ) : (
                  <div className="space-y-0.5">
                    {aggregations.totalsByCurrency.map((t) => (
                      <p key={t.currency} className="text-sm font-semibold">
                        {fmt(t.total)} {currencyLabel(t.currency)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <IconReceiptTax className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Royalty</p>
                {!aggregations ||
                aggregations.royaltyByCurrency.length === 0 ? (
                  <p className="text-xl font-bold">—</p>
                ) : (
                  <div className="space-y-0.5">
                    {aggregations.royaltyByCurrency.map((r) => (
                      <p key={r.currency} className="text-sm font-semibold">
                        {fmt(r.royalty)} {currencyLabel(r.currency)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown cards */}
        {charts && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>By Mineral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {charts.byMineral.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  charts.byMineral.map((m) => (
                    <div
                      key={m.mineral}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{m.mineral}</span>
                      <Badge variant="outline">{m.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Province</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {charts.byProvince.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  charts.byProvince.map((p) => (
                    <div
                      key={p.province}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{p.province}</span>
                      <Badge variant="outline">{p.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Currency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {charts.byCurrency.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  charts.byCurrency.map((c) => (
                    <div
                      key={c.currency}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{currencyLabel(c.currency)}</span>
                      <Badge variant="outline">{c.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trend charts */}
        {charts && charts.monthlyTrend.length > 0 && (
          <AuctionMonthlyChart data={charts.monthlyTrend} />
        )}
        {charts && charts.yearlyTrend.length > 0 && (
          <AuctionYearlyChart data={charts.yearlyTrend} />
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                <Label>Mineral</Label>
                <Select
                  value={filters.mineralTypeId || ALL}
                  onValueChange={(v) => handleFilterChange("mineralTypeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All minerals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All minerals</SelectItem>
                    {minerals.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={filters.provinceId ? String(filters.provinceId) : ALL}
                  onValueChange={(v) => handleFilterChange("provinceId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All provinces</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name ?? `#${p.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={filters.priceCurrency || ALL}
                  onValueChange={(v) => handleFilterChange("priceCurrency", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All currencies</SelectItem>
                    <SelectItem value="AFN">AFN</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Export + view options */}
        <div className="flex items-center justify-between">
          <PermissionGate permission="report.export">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Export:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAuctionReport(filters, "pdf")}
              >
                <IconFileTypePdf className="mr-2 h-4 w-4 text-red-600" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAuctionReport(filters, "excel")}
              >
                <IconFileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAuctionReport(filters, "csv")}
              >
                <IconFileTypeCsv className="mr-2 h-4 w-4 text-blue-600" />
                CSV
              </Button>
            </div>
          </PermissionGate>
          <DataTableViewOptions table={table} />
        </div>

        {/* Report table */}
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
                  <TableRow key={`s-${i}`}>
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
                    No results
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
                    fetchAll(updated);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100, 500].map((size) => (
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
