"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useTranslations } from "next-intl";

interface StatusChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "hsl(142, 71%, 45%)",
  EXPIRED: "hsl(0, 84%, 60%)",
  SUSPENDED: "hsl(45, 93%, 47%)",
};

export function LicenseStatusChart({ data }: StatusChartProps) {
  const t = useTranslations("reports");

  const chartConfig: ChartConfig = {
    ACTIVE: { label: t("activeLabel"), color: STATUS_COLORS.ACTIVE },
    EXPIRED: { label: t("expiredLabel"), color: STATUS_COLORS.EXPIRED },
    SUSPENDED: { label: t("suspendedLabel"), color: STATUS_COLORS.SUSPENDED },
  };

  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] || "hsl(var(--muted))",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("statusChartTitle")}</CardTitle>
        <CardDescription>
          {t("statusChartDescription", { count: total })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[280px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
