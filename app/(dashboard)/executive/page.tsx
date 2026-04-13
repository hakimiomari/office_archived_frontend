"use client";

import { useEffect, useState } from "react";
import {
  useExecutive,
  DashboardData,
  MinisterTravel,
  TravelType,
} from "@/config/executive/executive";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconFileText,
  IconPlane,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const CONTRACT_COLORS: Record<string, string> = {
  active: "hsl(142, 71%, 45%)",
  suspended: "hsl(45, 93%, 47%)",
  cancelled: "hsl(0, 70%, 55%)",
};

const TRAVEL_COLORS: Record<string, string> = {
  domestic: "hsl(221, 83%, 53%)",
  international: "hsl(262, 83%, 58%)",
};

export default function ExecutiveDashboardPage() {
  const { getDashboard, getRevenueTrend } = useExecutive();
  const t = useTranslations("executive");

  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<
    { year: number; revenue: number; expenses: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [d, rt] = await Promise.all([getDashboard(year), getRevenueTrend()]);
      setData(d);
      setRevenueTrend(rt);
      setLoading(false);
    })();
  }, [year]);

  const fmt = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    return v.toLocaleString();
  };

  const contractsData = data?.contracts
    ? [
        {
          name: "active",
          value: data.contracts.activeContracts,
          fill: CONTRACT_COLORS.active,
        },
        {
          name: "suspended",
          value: data.contracts.suspendedContracts,
          fill: CONTRACT_COLORS.suspended,
        },
        {
          name: "cancelled",
          value: data.contracts.cancelledContracts,
          fill: CONTRACT_COLORS.cancelled,
        },
      ].filter((d) => d.value > 0)
    : [];

  const contractsChartConfig: ChartConfig = {
    active: { label: t("activeContracts"), color: CONTRACT_COLORS.active },
    suspended: {
      label: t("suspendedContracts"),
      color: CONTRACT_COLORS.suspended,
    },
    cancelled: {
      label: t("cancelledContracts"),
      color: CONTRACT_COLORS.cancelled,
    },
  };

  const travelData = data?.travel
    ? [
        {
          name: "domestic",
          value: data.travel.domestic,
          fill: TRAVEL_COLORS.domestic,
        },
        {
          name: "international",
          value: data.travel.international,
          fill: TRAVEL_COLORS.international,
        },
      ].filter((d) => d.value > 0)
    : [];

  const travelChartConfig: ChartConfig = {
    domestic: { label: t("domesticTravels"), color: TRAVEL_COLORS.domestic },
    international: {
      label: t("internationalTravels"),
      color: TRAVEL_COLORS.international,
    },
  };

  const revenueChartConfig: ChartConfig = {
    revenue: { label: t("totalRevenue"), color: "hsl(142, 71%, 45%)" },
    expenses: { label: t("totalExpenses"), color: "hsl(0, 70%, 55%)" },
  };

  const contractsTrendConfig: ChartConfig = {
    totalContracts: {
      label: t("totalContracts"),
      color: "hsl(221, 83%, 53%)",
    },
    activeContracts: {
      label: t("activeContracts"),
      color: "hsl(142, 71%, 45%)",
    },
  };

  return (
    <RouteGuard permission="executive.read">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("year")}:</span>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCoin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalRevenue")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    fmt(data?.financial.totalRevenue)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <IconTrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalExpenses")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    fmt(data?.financial.totalExpenses)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconTrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("netProfit")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    fmt(data?.financial.netProfit)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <IconFileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalContracts")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    data?.contracts.totalContracts ?? 0
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <IconPlane className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalTravels")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    data?.travel.total ?? 0
                  )}
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
                <p className="text-sm text-muted-foreground">
                  {t("travelCost")}
                </p>
                <p className="text-xl font-bold">
                  {loading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    fmt(data?.travel.totalCost)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue trend chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("revenueTrend")}</CardTitle>
            <CardDescription>{t("totalRevenue")}</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrend.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("noKpis")}
              </p>
            ) : (
              <ChartContainer
                config={revenueChartConfig}
                className="h-[280px] w-full"
              >
                <LineChart data={revenueTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="revenue"
                    type="monotone"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    dataKey="expenses"
                    type="monotone"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("contractsDistribution")}</CardTitle>
              <CardDescription>{year}</CardDescription>
            </CardHeader>
            <CardContent>
              {contractsData.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t("noContractsSummary")}
                </p>
              ) : (
                <ChartContainer
                  config={contractsChartConfig}
                  className="mx-auto aspect-square h-[260px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={contractsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                    >
                      {contractsData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("travelDistribution")}</CardTitle>
              <CardDescription>{year}</CardDescription>
            </CardHeader>
            <CardContent>
              {travelData.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t("noTravels")}
                </p>
              ) : (
                <ChartContainer
                  config={travelChartConfig}
                  className="mx-auto aspect-square h-[260px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={travelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                    >
                      {travelData.map((entry, idx) => (
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

        {/* Contracts yearly trend */}
        {data && data.contractsYearlyTrend.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("contractsYearlyTrend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={contractsTrendConfig}
                className="h-[260px] w-full"
              >
                <BarChart data={data.contractsYearlyTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="totalContracts"
                    fill="var(--color-totalContracts)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activeContracts"
                    fill="var(--color-activeContracts)"
                    radius={[4, 4, 0, 0]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent travels */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recentTravels")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !data || data.recentTravels.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t("noTravels")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("travelType")}</TableHead>
                    <TableHead>{t("destination")}</TableHead>
                    <TableHead>{t("startDate")}</TableHead>
                    <TableHead>{t("endDate")}</TableHead>
                    <TableHead>{t("cost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTravels.map((travel: MinisterTravel) => (
                    <TableRow key={travel.id}>
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
                      <TableCell>
                        {new Date(travel.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {travel.endDate
                          ? new Date(travel.endDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{fmt(travel.cost)}</TableCell>
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
