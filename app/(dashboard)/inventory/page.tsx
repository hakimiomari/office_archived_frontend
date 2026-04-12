"use client";

import { useEffect, useState } from "react";
import { useInventory } from "@/config/inventory/inventory";
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
  IconPackage,
  IconBuildingWarehouse,
  IconTruck,
  IconAlertTriangle,
  IconChartBar,
} from "@tabler/icons-react";
import {
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

type Summary = {
  itemCount: number;
  warehouseCount: number;
  supplierCount: number;
  totalQuantity: number;
  lowStockCount: number;
};

const TYPE_COLORS: Record<string, string> = {
  IN: "hsl(142, 71%, 45%)",
  OUT: "hsl(0, 70%, 55%)",
  TRANSFER: "hsl(221, 83%, 53%)",
  ADJUSTMENT: "hsl(45, 93%, 47%)",
};

export default function InventoryDashboardPage() {
  const {
    getReportSummary,
    getLowStock,
    getMovementStats,
    getByWarehouse,
  } = useInventory();
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [movementStats, setMovementStats] = useState<any[]>([]);
  const [byWarehouse, setByWarehouse] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [s, ls, ms, bw] = await Promise.all([
        getReportSummary(),
        getLowStock(),
        getMovementStats(),
        getByWarehouse(),
      ]);
      setSummary(s);
      setLowStock(ls);
      setMovementStats(ms);
      setByWarehouse(bw);
      setLoading(false);
    })();
  }, []);

  const movementChartData = movementStats.map((m) => ({
    type: m.type,
    count: m.count,
    fill: TYPE_COLORS[m.type] ?? "hsl(var(--muted))",
  }));

  const movementChartConfig: ChartConfig = {
    IN: { label: t("stockIn"), color: TYPE_COLORS.IN },
    OUT: { label: t("stockOut"), color: TYPE_COLORS.OUT },
    TRANSFER: { label: t("stockTransfer"), color: TYPE_COLORS.TRANSFER },
    ADJUSTMENT: { label: t("stockAdjustment"), color: TYPE_COLORS.ADJUSTMENT },
  };

  const warehouseChartData = byWarehouse.map((w) => ({
    name: w.name,
    quantity: w.totalQuantity,
  }));

  const warehouseChartConfig: ChartConfig = {
    quantity: { label: t("totalQuantity"), color: "hsl(221, 83%, 53%)" },
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("title")}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconPackage className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalItems")}</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-6 w-12" /> : summary?.itemCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconBuildingWarehouse className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("warehouses")}</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-6 w-12" /> : summary?.warehouseCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <IconTruck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("suppliers")}</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-6 w-12" /> : summary?.supplierCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconChartBar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalQuantity")}</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-6 w-12" /> : summary?.totalQuantity ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("lowStockAlert")}</p>
                <p className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-6 w-12" /> : summary?.lowStockCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("movementsByType")}</CardTitle>
              <CardDescription>{t("movements")}</CardDescription>
            </CardHeader>
            <CardContent>
              {movementChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("noMovements")}
                </p>
              ) : (
                <ChartContainer
                  config={movementChartConfig}
                  className="mx-auto aspect-square h-[260px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
                    <Pie
                      data={movementChartData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                    >
                      {movementChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("stockByWarehouse")}</CardTitle>
              <CardDescription>{t("totalQuantity")}</CardDescription>
            </CardHeader>
            <CardContent>
              {warehouseChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("noWarehouses")}
                </p>
              ) : (
                <ChartContainer
                  config={warehouseChartConfig}
                  className="h-[260px] w-full"
                >
                  <BarChart data={warehouseChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="quantity"
                      fill="var(--color-quantity)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low stock items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              {t("lowStockAlert")}
            </CardTitle>
            <CardDescription>{t("itemsBelowMinStock")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noLowStock")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-2">{t("itemName")}</TableHead>
                    <TableHead className="px-4 py-2">{t("sku")}</TableHead>
                    <TableHead className="px-4 py-2">{t("category")}</TableHead>
                    <TableHead className="px-4 py-2">{t("totalStock")}</TableHead>
                    <TableHead className="px-4 py-2">{t("minStock")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-2 font-medium">{item.name}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {item.sku || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 font-semibold text-destructive">
                        {item.totalStock}
                      </TableCell>
                      <TableCell className="px-4 py-2">{item.minStock}</TableCell>
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
