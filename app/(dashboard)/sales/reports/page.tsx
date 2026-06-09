"use client";

import { useEffect, useState } from "react";
import {
  useSales,
  SalesReport,
  ReportPeriod,
} from "@/config/sales/sales";
import { useInventory, Warehouse } from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Combobox } from "@/components/ui/combobox";
import {
  IconCash,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconChartBar,
  IconDownload,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";

const STATUS_COLORS: Record<string, string> = {
  PAID: "hsl(142, 71%, 45%)",
  PARTIAL: "hsl(45, 93%, 47%)",
  UNPAID: "hsl(0, 70%, 55%)",
};

export default function SalesReportsPage() {
  const { getReport, downloadReportPdf } = useSales();
  const { getWarehouses } = useInventory();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [warehouseId, setWarehouseId] = useState<"ALL" | string>("ALL");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const whIdNum = warehouseId === "ALL" ? undefined : Number(warehouseId);

  const fetch = async () => {
    setLoading(true);
    const result = await getReport(period, undefined, undefined, whIdNum);
    setReport(result);
    setLoading(false);
  };

  useEffect(() => {
    getWarehouses({ limit: 200 }).then((r) => setWarehouses(r.data));
  }, []);

  useEffect(() => {
    fetch();
  }, [period, warehouseId]);

  const fmt = (v: number) => v.toLocaleString();

  // Chart data
  const statusData =
    report?.byStatus.map((s) => ({
      name: s.status,
      value: s.total,
      fill: STATUS_COLORS[s.status] ?? "hsl(var(--muted))",
    })) ?? [];

  const statusConfig: ChartConfig = {
    PAID: { label: t("paymentStatus_PAID"), color: STATUS_COLORS.PAID },
    PARTIAL: { label: t("paymentStatus_PARTIAL"), color: STATUS_COLORS.PARTIAL },
    UNPAID: { label: t("paymentStatus_UNPAID"), color: STATUS_COLORS.UNPAID },
  };

  const trendData =
    report?.revenueTrend.map((r) => ({
      day: new Date(r.day).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      revenue: r.revenue,
      count: r.count,
    })) ?? [];

  const trendConfig: ChartConfig = {
    revenue: { label: t("revenue"), color: "hsl(142, 71%, 45%)" },
  };

  const topProductsConfig: ChartConfig = {
    revenue: { label: t("revenue"), color: "hsl(221, 83%, 53%)" },
  };

  return (
    <RouteGuard permission="sale.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">{t("reports")}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Combobox
              value={warehouseId}
              onValueChange={(v) => setWarehouseId(v)}
              options={[
                { value: "ALL", label: tCommon("allWarehouses") },
                ...warehouses.map((w) => ({
                  value: String(w.id),
                  label: w.name,
                })),
              ]}
              placeholder={tCommon("allWarehouses")}
              triggerClassName="h-9 w-[200px]"
              searchPlaceholder="Search warehouses..."
              emptyMessage="No warehouse found."
            />
            <Combobox
              value={period}
              onValueChange={(v) => setPeriod(v as ReportPeriod)}
              options={[
                { value: "daily", label: t("periodDaily") },
                { value: "weekly", label: t("periodWeekly") },
                { value: "monthly", label: t("periodMonthly") },
                { value: "yearly", label: t("periodYearly") },
              ]}
              triggerClassName="h-9 w-[180px]"
              searchPlaceholder="Search..."
              emptyMessage="No period found."
            />
            <Button
              variant="default"
              disabled={loading || generating}
              onClick={async () => {
                setGenerating(true);
                await downloadReportPdf(period, undefined, undefined, whIdNum);
                setGenerating(false);
              }}
            >
              <IconDownload className="me-2 h-4 w-4" />
              {generating ? tCommon("loading") : tCommon("generatePdf")}
            </Button>
          </div>
        </div>

        {/* Financial KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <IconCash className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("revenue")}</p>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(report?.financial.revenue ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <IconTrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("expenses")}</p>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(report?.financial.expenses ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <IconTrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("profit")}</p>
                <div
                  className={`text-2xl font-bold ${
                    (report?.financial.profit ?? 0) < 0 ? "text-red-600" : ""
                  }`}
                >
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(report?.financial.profit ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <IconAlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pendingPayments")}
                </p>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    fmt(report?.financial.pendingPayments ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconReceipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("salesCount")}
                </p>
                <div className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    report?.counts.salesCount ?? 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <IconCash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("cashReceived")}
                </p>
                <div className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    fmt(report?.financial.cashReceived ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <IconChartBar className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("subtotal")}</p>
                <div className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    fmt(report?.financial.subtotal ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <IconTrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("discount")}</p>
                <div className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    fmt(report?.financial.discount ?? 0)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue trend chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5 text-primary" />
              {t("revenueTrend")}
            </CardTitle>
            <CardDescription>
              {report?.range &&
                `${new Date(report.range.start).toLocaleDateString()} — ${new Date(report.range.end).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : trendData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("noData")}
              </p>
            ) : (
              <ChartContainer
                config={trendConfig}
                className="h-[280px] w-full"
              >
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="fillReportRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillReportRevenue)"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart + top products */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("paymentStatus")}</CardTitle>
              <CardDescription>
                {report?.counts.salesCount ?? 0} {t("salesCount").toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="mx-auto h-[260px] w-[260px] rounded-full" />
              ) : statusData.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t("noData")}
                </p>
              ) : (
                <ChartContainer
                  config={statusConfig}
                  className="mx-auto aspect-square h-[260px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="name" />}
                    />
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("topProducts")}</CardTitle>
              <CardDescription>{t("byRevenue")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (report?.topProducts.length ?? 0) === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t("noData")}
                </p>
              ) : (
                <ChartContainer
                  config={topProductsConfig}
                  className="h-[260px] w-full"
                >
                  <BarChart
                    data={(report?.topProducts ?? []).slice(0, 8)}
                    layout="vertical"
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top products table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (report?.topProducts.length ?? 0) === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t("noData")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead>{tCommon("sku") || "SKU"}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("revenue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report?.topProducts.map((p, idx) => (
                    <TableRow key={p.itemId}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.sku || "—"}
                      </TableCell>
                      <TableCell>{fmt(p.quantity)}</TableCell>
                      <TableCell className="font-semibold">
                        {fmt(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
