"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface MonthlyTrendChartProps {
  data: { month: string; small: number; large: number; total: number }[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const t = useTranslations("reports");

  const chartConfig: ChartConfig = {
    small: {
      label: t("smallScaleLabel"),
      color: "hsl(221, 83%, 53%)",
    },
    large: {
      label: t("largeScaleLabel"),
      color: "hsl(262, 83%, 58%)",
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle>{t("monthlyChartTitle")}</CardTitle>
        <CardDescription>{t("monthlyChartDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillSmall" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-small)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-small)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillLarge" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-large)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-large)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                const date = new Date(Number(year), Number(month) - 1);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const date = new Date(Number(year), Number(month) - 1);
                    return date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="small"
              type="monotone"
              fill="url(#fillSmall)"
              stroke="var(--color-small)"
              stackId="a"
            />
            <Area
              dataKey="large"
              type="monotone"
              fill="url(#fillLarge)"
              stroke="var(--color-large)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
