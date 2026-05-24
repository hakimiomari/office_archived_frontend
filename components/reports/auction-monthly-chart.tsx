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

interface AuctionMonthlyChartProps {
  data: { month: string; count: number }[];
}

const chartConfig: ChartConfig = {
  count: { label: "Auctions", color: "hsl(262, 83%, 58%)" },
};

export function AuctionMonthlyChart({ data }: AuctionMonthlyChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>
          Auctions per month (by auction date)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillAuctions" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                const d = new Date(Number(year), Number(month) - 1);
                return d.toLocaleDateString("en-US", {
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
                    const d = new Date(Number(year), Number(month) - 1);
                    return d.toLocaleDateString("en-US", {
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
              fill="url(#fillAuctions)"
              stroke="var(--color-count)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
