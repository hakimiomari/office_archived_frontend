"use client";

import { useEffect, useState } from "react";
import { useEmployees, EmployeeSummary } from "@/config/employees/employees";
import { useInventory } from "@/config/inventory/inventory";
import {
  useSales,
  SalesSummary,
  SalesReport,
  Sale,
} from "@/config/sales/sales";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  IconUsers,
  IconBuilding,
  IconPackage,
  IconBuildingWarehouse,
  IconAlertTriangle,
  IconChartBar,
  IconCash,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconUserPlus,
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
import { useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";
import { nextRoute } from "@/lib/route";

type InventorySummary = {
  itemCount: number;
  warehouseCount: number;
  supplierCount: number;
  totalQuantity: number;
  lowStockCount: number;
};

const DEPT_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 65%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(190, 80%, 50%)",
];

export default function DashboardPage() {
  const { getSummary: getEmployeeSummary } = useEmployees();
  const { getReportSummary: getInventorySummary, getLowStock } = useInventory();
  const {
    getSummary: getSalesSummary,
    getReport: getSalesReport,
    getOverdueSales,
  } = useSales();
  const { user } = useUser();
  const { changeRoute } = nextRoute();

  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tEmp = useTranslations("employees");
  const tInv = useTranslations("inventory");
  const tSales = useTranslations("sales");

  const [loading, setLoading] = useState(true);
  const [empSummary, setEmpSummary] = useState<EmployeeSummary | null>(null);
  const [invSummary, setInvSummary] = useState<InventorySummary | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [overdue, setOverdue] = useState<Sale[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [emp, inv, low, ss, rep, od] = await Promise.all([
        getEmployeeSummary(),
        getInventorySummary(),
        getLowStock(),
        getSalesSummary(),
        getSalesReport("monthly"),
        getOverdueSales(),
      ]);
      setEmpSummary(emp);
      setInvSummary(inv);
      setLowStock(low ?? []);
      setSalesSummary(ss);
      setSalesReport(rep);
      setOverdue(od);
      setLoading(false);
    })();
  }, []);

  const fmt = (v: number) => v.toLocaleString();
  const daysBetween = (a: Date, b: Date) =>
    Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

  // Department distribution pie chart
  const deptChartData = (empSummary?.byDepartment ?? [])
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: d.departmentName,
      value: d.count,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));

  const deptChartConfig: ChartConfig = deptChartData.reduce(
    (acc, d) => ({
      ...acc,
      [d.name]: { label: d.name, color: d.fill },
    }),
    {} as ChartConfig,
  );

  // Revenue trend from sales report
  const trendData = (salesReport?.revenueTrend ?? []).map((r) => ({
    day: new Date(r.day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    revenue: r.revenue,
  }));

  const trendConfig: ChartConfig = {
    revenue: { label: tSales("revenue"), color: "hsl(142, 71%, 45%)" },
  };

  // Top products bar
  const topProducts = (salesReport?.topProducts ?? []).slice(0, 6);
  const topProductsConfig: ChartConfig = {
    revenue: { label: tSales("revenue"), color: "hsl(221, 83%, 53%)" },
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Hero header */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("welcome")}
              {user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Badge variant="default" className="text-base px-3 py-1">
            {new Date().getFullYear()}
          </Badge>
        </div>
      </div>

      {/* Financial KPIs from sales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <IconCash className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tSales("todayRevenue")}
              </p>
              <p className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  fmt(salesSummary?.todayRevenue ?? 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <IconReceipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tSales("monthRevenue")}
              </p>
              <p className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  fmt(salesSummary?.monthRevenue ?? 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <IconTrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tSales("profit")}
              </p>
              <p
                className={`text-2xl font-bold ${
                  (salesReport?.financial.profit ?? 0) < 0 ? "text-red-600" : ""
                }`}
              >
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  fmt(salesReport?.financial.profit ?? 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <IconAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tSales("pendingPayments")}
              </p>
              <p className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  fmt(salesSummary?.pendingPayments ?? 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-module cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/sales/customers")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <IconUserPlus className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tSales("totalCustomers")}
              </p>
              <p className="text-xl font-bold">
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  salesSummary?.totalCustomers ?? 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/employees")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconUsers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tEmp("total")}</p>
              <p className="text-xl font-bold">
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  empSummary?.totalEmployees ?? 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/inventory/items")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <IconPackage className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tInv("totalItems")}
              </p>
              <p className="text-xl font-bold">
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  invSummary?.itemCount ?? 0
                )}
              </p>
              {invSummary && invSummary.lowStockCount > 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-0.5">
                  <IconAlertTriangle className="h-3 w-3" />
                  {invSummary.lowStockCount}{" "}
                  {tInv("lowStockAlert").toLowerCase()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/inventory/warehouses")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <IconBuildingWarehouse className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tInv("warehouses")}
              </p>
              <p className="text-xl font-bold">
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  invSummary?.warehouseCount ?? 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5 text-primary" />
            {tSales("revenueTrend")}
          </CardTitle>
          <CardDescription>{tSales("periodMonthly")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : trendData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tSales("noData")}
            </p>
          ) : (
            <ChartContainer config={trendConfig} className="h-[260px] w-full">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient
                    id="fillDashRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  fill="url(#fillDashRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts row: top products + dept distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{tSales("topProducts")}</CardTitle>
            <CardDescription>{tSales("byRevenue")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : topProducts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {tSales("noData")}
              </p>
            ) : (
              <ChartContainer
                config={topProductsConfig}
                className="h-[260px] w-full"
              >
                <BarChart data={topProducts} layout="vertical">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{tEmp("departments")}</CardTitle>
            <CardDescription>{tEmp("total")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="mx-auto h-[260px] w-[260px] rounded-full" />
            ) : deptChartData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {tEmp("noDepartments")}
              </p>
            ) : (
              <ChartContainer
                config={deptChartConfig}
                className="mx-auto aspect-square h-[260px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={deptChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {deptChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts row: overdue invoices + low stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-600" />
              {tSales("overdue")}
              {overdue.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {overdue.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : overdue.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {tSales("noOverdue")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tSales("invoiceNo")}</TableHead>
                    <TableHead>{tSales("customer")}</TableHead>
                    <TableHead>{tSales("remainingAmount")}</TableHead>
                    <TableHead>{tSales("dueDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.slice(0, 5).map((s) => {
                    const days = s.dueDate
                      ? daysBetween(new Date(s.dueDate), new Date())
                      : 0;
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => changeRoute("/sales")}
                      >
                        <TableCell className="font-mono text-xs">
                          {s.invoiceNo}
                        </TableCell>
                        <TableCell>{s.customer?.name ?? "—"}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {fmt(s.remainingAmount)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.dueDate
                            ? new Date(s.dueDate).toLocaleDateString()
                            : "—"}
                          {days > 0 && (
                            <span className="ms-1 text-red-600">
                              ({days} {tSales("daysOverdue")})
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              {tInv("lowStockAlert")}
              {lowStock.length > 0 && (
                <Badge variant="destructive" className="ms-2">
                  {lowStock.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {tInv("noLowStock")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tSales("item")}</TableHead>
                    <TableHead>{tInv("unit")}</TableHead>
                    <TableHead>{tInv("minStock")}</TableHead>
                    <TableHead>{tInv("currentStock")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.slice(0, 5).map((it: any) => (
                    <TableRow
                      key={it.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => changeRoute("/inventory/items")}
                    >
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {it.unit}
                      </TableCell>
                      <TableCell>{it.minStock}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {it.totalStock ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
