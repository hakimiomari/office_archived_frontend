"use client";

import { useEffect, useState } from "react";
import { useExecutive, DashboardData } from "@/config/executive/executive";
import { useAuctions, AuctionSummary } from "@/config/auction/auction";
import api from "@/lib/api/axios";
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
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconFileText,
  IconGavel,
  IconPlane,
  IconAlertTriangle,
  IconChartBar,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
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
import { useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";
import { nextRoute } from "@/lib/route";
import { MonthlyTrendChart } from "@/components/reports/monthly-trend-chart";

type LicenseStats = {
  totalLicenses: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  monthlyTrend: {
    month: string;
    issued: number;
    expiring: number;
    total: number;
  }[];
};

const CONTRACT_COLORS: Record<string, string> = {
  active: "hsl(142, 71%, 45%)",
  suspended: "hsl(45, 93%, 47%)",
  cancelled: "hsl(0, 70%, 55%)",
};

const LICENSE_COLORS: Record<string, string> = {
  ACTIVE: "hsl(142, 71%, 45%)",
  EXPIRED: "hsl(0, 70%, 55%)",
  TERMINATED: "hsl(0, 0%, 45%)",
  PENDING: "hsl(45, 93%, 47%)",
};

export default function DashboardPage() {
  const { getDashboard, getRevenueTrend } = useExecutive();
  const { getAuctionSummary } = useAuctions();
  const { user } = useUser();
  const { changeRoute } = nextRoute();

  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tExec = useTranslations("executive");
  const tLic = useTranslations("licenses");

  const [loading, setLoading] = useState(true);
  const [exec, setExec] = useState<DashboardData | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<
    { year: number; revenue: number; expenses: number }[]
  >([]);
  const [licenseStats, setLicenseStats] = useState<LicenseStats | null>(null);
  const [auctionSummary, setAuctionSummary] = useState<AuctionSummary | null>(
    null,
  );

  const fetchLicenseStats = async (): Promise<LicenseStats | null> => {
    try {
      const res = await api.get("reports/licenses/charts");
      const data = res.data;
      const totalLicenses =
        data.byStatus?.reduce((s: number, r: any) => s + r.count, 0) ?? 0;
      return {
        totalLicenses,
        byStatus: data.byStatus ?? [],
        byType: data.byType ?? [],
        monthlyTrend: data.monthlyTrend ?? [],
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [execData, rt, ls, auct] = await Promise.all([
        getDashboard(),
        getRevenueTrend(),
        fetchLicenseStats(),
        getAuctionSummary(),
      ]);
      setExec(execData);
      setRevenueTrend(rt);
      setLicenseStats(ls);
      setAuctionSummary(auct);
      setLoading(false);
    })();
  }, []);

  const fmt = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    return v.toLocaleString();
  };

  // Chart data
  const contractsData = exec?.contracts
    ? [
        {
          name: "active",
          value: exec.contracts.activeContracts,
          fill: CONTRACT_COLORS.active,
        },
        {
          name: "suspended",
          value: exec.contracts.suspendedContracts,
          fill: CONTRACT_COLORS.suspended,
        },
        {
          name: "cancelled",
          value: exec.contracts.cancelledContracts,
          fill: CONTRACT_COLORS.cancelled,
        },
      ].filter((d) => d.value > 0)
    : [];

  const contractsChartConfig: ChartConfig = {
    active: { label: tExec("activeContracts"), color: CONTRACT_COLORS.active },
    suspended: {
      label: tExec("suspendedContracts"),
      color: CONTRACT_COLORS.suspended,
    },
    cancelled: {
      label: tExec("cancelledContracts"),
      color: CONTRACT_COLORS.cancelled,
    },
  };

  const licenseChartData =
    licenseStats?.byStatus.map((s) => ({
      name: s.status,
      value: s.count,
      fill: LICENSE_COLORS[s.status] ?? "hsl(var(--muted))",
    })) ?? [];

  const licenseChartConfig: ChartConfig = {
    ACTIVE: { label: "Active", color: LICENSE_COLORS.ACTIVE },
    EXPIRED: { label: "Expired", color: LICENSE_COLORS.EXPIRED },
    TERMINATED: { label: "Terminated", color: LICENSE_COLORS.TERMINATED },
    PENDING: { label: "Pending", color: LICENSE_COLORS.PENDING },
  };

  const revenueChartConfig: ChartConfig = {
    revenue: { label: tExec("totalRevenue"), color: "hsl(142, 71%, 45%)" },
    expenses: { label: tExec("totalExpenses"), color: "hsl(0, 70%, 55%)" },
  };

  const contractsTrendConfig: ChartConfig = {
    totalContracts: {
      label: tExec("totalContracts"),
      color: "hsl(221, 83%, 53%)",
    },
    activeContracts: {
      label: tExec("activeContracts"),
      color: "hsl(142, 71%, 45%)",
    },
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
              {tExec("subtitle")} · {tExec("year")}{" "}
              {exec?.year ?? new Date().getFullYear()}
            </p>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            {tExec("year")}: {exec?.year ?? new Date().getFullYear()}
          </Badge>
        </div>
      </div>

      {/* Top financial cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <IconCoin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tExec("totalRevenue")}
              </p>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                fmt(exec?.financial.totalRevenue)
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <IconTrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tExec("totalExpenses")}
              </p>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                fmt(exec?.financial.totalExpenses)
              )}
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
                {tExec("netProfit")}
              </p>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                fmt(exec?.financial.netProfit)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-module quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/licenses")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <IconFileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tLic("title")}</p>
              {loading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                (licenseStats?.totalLicenses ?? 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/auctions")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <IconGavel className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auctions</p>
              {loading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="text-xl font-bold">
                  {auctionSummary?.total ?? 0}
                </p>
              )}
              {auctionSummary && auctionSummary.byMineral.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Top: {auctionSummary.byMineral[0].mineral} (
                  {auctionSummary.byMineral[0].count})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <IconCoin className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Auction Totals</p>
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : !auctionSummary ||
                auctionSummary.totalsByCurrency.length === 0 ? (
                <p className="text-xl font-bold">—</p>
              ) : (
                <div className="space-y-0.5">
                  {auctionSummary.totalsByCurrency.map((t) => {
                    const r = auctionSummary.royaltyByCurrency.find(
                      (x) => x.currency === t.currency,
                    );
                    const sym = t.currency === "USD" ? "$" : t.currency;
                    return (
                      <div key={t.currency} className="text-sm">
                        <span className="font-semibold">
                          {fmt(t.total)} {sym}
                        </span>
                        {r && r.royalty > 0 && (
                          <span className="ml-2 text-xs text-emerald-600">
                            royalty {fmt(r.royalty)} {sym}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50 transition"
          onClick={() => changeRoute("/executive/travels")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <IconPlane className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {tExec("totalTravels")}
              </p>
              {loading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                (exec?.travel.total ?? 0)
              )}
              {exec && exec.travel.totalCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  {fmt(exec.travel.totalCost)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5 text-primary" />
            {tExec("revenueTrend")}
          </CardTitle>
          <CardDescription>
            {tExec("totalRevenue")} / {tExec("totalExpenses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : revenueTrend.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tExec("noKpis")}
            </p>
          ) : (
            <ChartContainer
              config={revenueChartConfig}
              className="h-[280px] w-full"
            >
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-expenses)"
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-expenses)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="expenses"
                  type="monotone"
                  fill="url(#fillExpenses)"
                  stroke="var(--color-expenses)"
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie charts: contracts distribution + license status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{tExec("contractsDistribution")}</CardTitle>
            <CardDescription>{exec?.year ?? ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="mx-auto h-[260px] w-[260px] rounded-full" />
            ) : contractsData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {tExec("noContractsSummary")}
              </p>
            ) : (
              <ChartContainer
                config={contractsChartConfig}
                className="mx-auto aspect-square h-[260px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                  />
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
            <CardTitle>
              {tLic("title")} — {tCommon("status")}
            </CardTitle>
            <CardDescription>
              {licenseStats?.totalLicenses ?? 0} {tLic("title").toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="mx-auto h-[260px] w-[260px] rounded-full" />
            ) : licenseChartData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {tLic("noLicenses")}
              </p>
            ) : (
              <ChartContainer
                config={licenseChartConfig}
                className="mx-auto aspect-square h-[260px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                  />
                  <Pie
                    data={licenseChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {licenseChartData.map((entry, idx) => (
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
      </div>

      {/* Contracts yearly trend */}
      {exec && exec.contractsYearlyTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{tExec("contractsYearlyTrend")}</CardTitle>
            <CardDescription>{tExec("contractsSummary")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={contractsTrendConfig}
              className="h-[260px] w-full"
            >
              <BarChart data={exec.contractsYearlyTrend}>
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

      {/* License issued vs expiring monthly trend */}
      {!loading &&
        licenseStats &&
        licenseStats.monthlyTrend.length > 0 && (
          <MonthlyTrendChart data={licenseStats.monthlyTrend} />
        )}

      {/* Recent travels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlane className="h-5 w-5 text-cyan-600" />
            {tExec("recentTravels")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !exec || exec.recentTravels.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              {tExec("noTravels")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tExec("travelType")}</TableHead>
                  <TableHead>{tExec("destination")}</TableHead>
                  <TableHead>{tExec("startDate")}</TableHead>
                  <TableHead>{tExec("cost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exec.recentTravels.slice(0, 5).map((travel) => (
                  <TableRow key={travel.id}>
                    <TableCell>
                      <Badge
                        variant={
                          travel.type === "INTERNATIONAL"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {travel.type === "DOMESTIC"
                          ? tExec("domesticTravels")
                          : tExec("internationalTravels")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {travel.destination}
                    </TableCell>
                    <TableCell>
                      {new Date(travel.startDate).toLocaleDateString()}
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
  );
}
