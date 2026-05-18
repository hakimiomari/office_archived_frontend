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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface YearlyTrendChartProps {
  data: {
    year: string;
    issued: number;
    expiring: number;
    total: number;
  }[];
}

const chartConfig: ChartConfig = {
  issued: { label: "Issued", color: "hsl(142, 71%, 45%)" },
  expiring: { label: "Expiring", color: "hsl(0, 70%, 55%)" },
};

export function YearlyTrendChart({ data }: YearlyTrendChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle>Yearly Trend</CardTitle>
        <CardDescription>
          Licenses issued (by issue date) vs expiring (by expiry date) per
          year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="issued"
              fill="var(--color-issued)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expiring"
              fill="var(--color-expiring)"
              radius={[4, 4, 0, 0]}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
