"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface ProvinceChartProps {
  data: { province: string; count: number }[];
}

export function ProvinceChart({ data }: ProvinceChartProps) {
  const t = useTranslations("reports");

  const chartConfig: ChartConfig = {
    count: {
      label: t("licensesLabel"),
      color: "var(--primary)",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("provinceChartTitle")}</CardTitle>
        <CardDescription>{t("provinceChartDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 10, right: 10 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="province"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tickFormatter={(value) =>
                value.length > 12 ? value.slice(0, 12) + "..." : value
              }
            />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
