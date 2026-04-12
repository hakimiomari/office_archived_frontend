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

interface Props {
  data: { status: string; count: number }[];
}

const COLORS: Record<string, string> = {
  OPEN: "hsl(142, 71%, 45%)",
  CLOSED: "hsl(0, 0%, 60%)",
};

export function TenderStatusChart({ data }: Props) {
  const t = useTranslations("tenders");

  const chartConfig: ChartConfig = {
    OPEN: { label: t("open"), color: COLORS.OPEN },
    CLOSED: { label: t("closed"), color: COLORS.CLOSED },
  };

  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    fill: COLORS[d.status] || "hsl(var(--muted))",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("statusDistribution")}</CardTitle>
        <CardDescription>
          {total} {t("totalTenders").toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[260px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              strokeWidth={2}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
