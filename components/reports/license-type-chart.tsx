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

interface TypeChartProps {
  data: { type: string; count: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  SMALL: "hsl(221, 83%, 53%)",
  LARGE: "hsl(262, 83%, 58%)",
};

export function LicenseTypeChart({ data }: TypeChartProps) {
  const t = useTranslations("reports");

  const chartConfig: ChartConfig = {
    SMALL: { label: t("smallScaleLabel"), color: TYPE_COLORS.SMALL },
    LARGE: { label: t("largeScaleLabel"), color: TYPE_COLORS.LARGE },
  };

  const chartData = data.map((d) => ({
    name: d.type,
    value: d.count,
    fill: TYPE_COLORS[d.type] || "hsl(var(--muted))",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("typeChartTitle")}</CardTitle>
        <CardDescription>
          {t("typeChartDescription", { count: total })}
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
