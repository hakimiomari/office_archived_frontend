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
} from "@/components/ui/chart";
import { useTranslations } from "next-intl";

interface Props {
  data: { month: string; count: number }[];
}

export function TenderMonthlyChart({ data }: Props) {
  const t = useTranslations("tenders");

  const chartConfig: ChartConfig = {
    count: {
      label: t("totalTenders"),
      color: "hsl(221, 83%, 53%)",
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle>{t("monthlyTrend")}</CardTitle>
        <CardDescription>{t("monthlyTrendDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
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
              tickFormatter={(value: string) => {
                const [year, month] = value.split("-");
                if (!year || !month) return value;
                const date = new Date(Number(year), Number(month) - 1);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    const [year, month] = value.split("-");
                    if (!year || !month) return value;
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
              dataKey="count"
              type="monotone"
              fill="url(#fillCount)"
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
