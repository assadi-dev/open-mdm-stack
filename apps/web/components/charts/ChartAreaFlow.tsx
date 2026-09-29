"use client";

import { useId } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/badges/Badge";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { FlowDatum, FlowHighlight } from "@/types/chart";

// Espace réservé au-dessus et au-dessous du tracé pour les deux pastilles.
const PILL_SPACE = 36;
const EDGE_PADDING = 6;

const BANDS = [
  { dataKey: "outer", ratio: 1, opacity: 0.2 },
  { dataKey: "mid", ratio: 0.66, opacity: 0.45 },
  { dataKey: "core", ratio: 0.32, opacity: 1 },
] as const;

type ChartAreaFlowProps = {
  data: FlowDatum[];
  label: string;
  highlight?: FlowHighlight;
  height?: number;
  className?: string;
};

export const ChartAreaFlow = ({ data, label, highlight, height = 150, className }: ChartAreaFlowProps) => {
  const gradientId = `flow-${useId().replace(/:/g, "")}`;
  const count = data.length;
  const max = Math.max(...data.map((datum) => datum.value), 1);

  const toRow = (x: number, value: number) => ({
    x,
    outer: [-value, value],
    mid: [-value * BANDS[1].ratio, value * BANDS[1].ratio],
    core: [-value * BANDS[2].ratio, value * BANDS[2].ratio],
  });
  // Un point par colonne, plus un point à chaque bord pour que le flux occupe toute la largeur.
  const rows = [
    toRow(0, data[0]?.value ?? 0),
    ...data.map((datum, index) => toRow(index + 0.5, datum.value)),
    toRow(count, data[count - 1]?.value ?? 0),
  ];
  const highlightLeft = highlight ? `${((highlight.index + 0.5) / count) * 100}%` : undefined;
  const summary = data.map((datum) => `${datum.label} ${datum.value}`).join(", ");

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="relative w-full" style={{ height: height + PILL_SPACE * 2 }}>
        <ChartContainer
          config={{ value: { label, color: "var(--flow-orange)" } }}
          role="img"
          aria-label={`${label} : ${summary}`}
          className="aspect-auto size-full"
        >
          <AreaChart data={rows} margin={{ top: PILL_SPACE + EDGE_PADDING, right: 0, bottom: PILL_SPACE + EDGE_PADDING, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="var(--flow-orange)" />
                <stop offset="0.5" stopColor="var(--flow-sage)" />
                <stop offset="1" stopColor="var(--flow-sky)" />
              </linearGradient>
            </defs>
            <XAxis dataKey="x" type="number" domain={[0, count]} hide />
            <YAxis hide domain={[-max, max]} />
            {BANDS.map((band) => (
              <Area
                key={band.dataKey}
                dataKey={band.dataKey}
                type="monotone"
                stroke="none"
                fill={`url(#${gradientId})`}
                fillOpacity={band.opacity}
                dot={false}
                activeDot={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        {highlight && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-7.5 bottom-7.5 w-0 border-l-[1.5px] border-dashed border-ink"
              style={{ left: highlightLeft }}
            />
            {highlight.top && (
              <Badge
                variant="secondary"
                className="absolute top-0 h-auto -translate-x-1/2 bg-ink px-3 text-[0.8125rem] leading-4.5 text-ink-foreground tabular-nums"
                style={{ left: highlightLeft }}
              >
                {highlight.top}
              </Badge>
            )}
            {highlight.bottom && (
              <Badge
                variant="secondary"
                className="absolute bottom-0 h-auto -translate-x-1/2 border-card-border bg-card-strong px-3 text-[0.8125rem] leading-4.5 text-foreground tabular-nums"
                style={{ left: highlightLeft }}
              >
                {highlight.bottom}
              </Badge>
            )}
          </>
        )}
      </div>
      <div aria-hidden="true" className="grid auto-cols-fr grid-flow-col text-center text-sm leading-5 text-muted-foreground">
        {data.map((datum, index) => (
          <span key={datum.label} className={cn(highlight?.index === index && "font-semibold text-primary-text")}>
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
};
