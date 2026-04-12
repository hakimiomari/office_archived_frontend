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
  data: { sector: string; count: number }[];
}

const COLORS: Record<string, string> = {
  MINING: "hsl(35, 80%, 45%)",
  OIL: "hsl(0, 70%, 50%)",
  GAS: "hsl(200, 75%, 50%)",
  CONSULTING: "hsl(262, 70%, 55%)",
  OTHER: "hsl(0, 0%, 60%)",
};

export function TenderSectorChart({ data }: Props) {
  const t = useTranslations("tenders");

  const chartConfig: ChartConfig = {
    MINING: { label: t("sectorMining"), color: COLORS.MINING },
    OIL: { label: t("sectorOil"), color: COLORS.OIL },
    GAS: { label: t("sectorGas"), color: COLORS.GAS },
    CONSULTING: { label: t("sectorConsulting"), color: COLORS.CONSULTING },
    OTHER: { label: t("sectorOther"), color: COLORS.OTHER },
  };

  const chartData = data.map((d) => ({
    name: d.sector,
    value: d.count,
    fill: COLORS[d.sector] || COLORS.OTHER,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("sectorDistribution")}</CardTitle>
        <CardDescription>{t("sector")}</CardDescription>
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
