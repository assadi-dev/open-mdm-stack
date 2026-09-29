"use client";

import { Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChartDatum } from "@/types/chart";
import { buildSeries } from "./chart-series";

type ChartPieDonutTextProps = {
  data: ChartDatum[];
  value: string;
  label: string;
  caption?: string;
  size?: number;
  className?: string;
};

export const ChartPieDonutText = ({ data, value, label, caption, size = 190, className }: ChartPieDonutTextProps) => {
  const series = buildSeries(data);
  const total = series.reduce((sum, item) => sum + item.value, 0) || 1;
  const percentOf = (item: { value: number }) => formatPercent((item.value / total) * 100, 0);

  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;
  const rows = series.map((item) => ({ ...item, fill: `var(--color-${item.key})` }));
  const summary = series.map((item) => `${item.label} ${percentOf(item)}`).join(", ");

  return (
    <div className={cn("flex items-center gap-7", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ChartContainer config={config} role="img" aria-label={`${label} : ${summary}`} className="aspect-auto size-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel className="bg-popover shadow-none" />} />
            <Pie
              data={rows}
              dataKey="value"
              nameKey="key"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={1.5}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl leading-7.5 font-semibold tracking-[-0.5px] tabular-nums">{value}</span>
          {caption && <span className="text-xs leading-4 text-muted-foreground">{caption}</span>}
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-3">
        {series.map((item) => (
          <li
            key={item.key}
            className="grid grid-cols-[10px_1fr_auto] items-center gap-2.5 text-[13px] leading-4.5 font-medium whitespace-nowrap"
          >
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="font-normal text-muted-foreground tabular-nums">{percentOf(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
