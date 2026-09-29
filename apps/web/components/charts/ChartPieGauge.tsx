"use client";

import { useId } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const SEGMENT_COUNT = 18;
const PAD_ANGLE = 3;
const CORNER_RADIUS = 4;
const INNER_RATIO = 0.68;

type ChartPieGaugeProps = {
  value: number;
  label: string;
  valueLabel?: string;
  caption?: string;
  max?: number;
  size?: number;
  className?: string;
};

export const ChartPieGauge = ({ value, label, valueLabel, caption, max = 100, size = 280, className }: ChartPieGaugeProps) => {
  const gradientId = `gauge-${useId().replace(/:/g, "")}`;
  const center = size / 2;
  const outerRadius = center - 2;
  const activeCount = Math.round((Math.min(Math.max(value, 0), max) / max) * SEGMENT_COUNT);
  const segments = Array.from({ length: SEGMENT_COUNT }, (_, index) => ({ id: index, value: 1, active: index < activeCount }));

  return (
    <div className={cn("relative flex max-w-full flex-col items-center", className)} style={{ width: size }}>
      <ChartContainer
        config={{}}
        role="img"
        aria-label={`${label} : ${valueLabel ?? value}`}
        className="aspect-auto"
        style={{ width: size, height: center + 2 }}
      >
        <PieChart>
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} x2={size} y1={0} y2={0}>
              <stop offset="0" stopColor="var(--flame-500)" />
              <stop offset="0.55" stopColor="var(--flame-400)" />
              <stop offset="1" stopColor="var(--flame-200)" />
            </linearGradient>
          </defs>
          <Pie
            data={segments}
            dataKey="value"
            cx={center}
            cy={center}
            startAngle={180}
            endAngle={0}
            innerRadius={outerRadius * INNER_RATIO}
            outerRadius={outerRadius}
            paddingAngle={PAD_ANGLE}
            cornerRadius={CORNER_RADIUS}
            stroke="none"
          >
            {segments.map((segment) => (
              <Cell key={segment.id} fill={segment.active ? `url(#${gradientId})` : "var(--chart-track)"} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center text-center"
        style={{ top: center + 2 - 42 }}
      >
        <span className="text-[32px] leading-9.5 font-semibold tracking-[-0.8px] tabular-nums">{valueLabel ?? value}</span>
      </div>
      <div aria-hidden="true" className="mt-1 flex w-full justify-between px-3 text-xs leading-4 text-muted-foreground">
        <span>0</span>
        <span>{max}</span>
      </div>
      {caption && <span className="mt-2 text-center text-[13px] leading-4.5 text-muted-foreground">{caption}</span>}
    </div>
  );
};
