import { CHART } from "@/constants/chart";
import type { ChartDatum } from "@/types/chart";

const MAX_SERIES = 4;
const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const OTHER_COLOR = "var(--chart-5)";

export type ChartSeries = ChartDatum & {
  key: string;
  color: string;
};

// Ordre catégoriel fixe : les 4 premières séries prennent chart-1 à chart-4, le reste est agrégé dans « Autres ».
export const buildSeries = (data: ChartDatum[]): ChartSeries[] => {
  const named: ChartDatum[] = [];
  let otherValue = 0;
  let hasOther = false;

  for (const datum of data) {
    if (datum.other || named.length >= MAX_SERIES) {
      otherValue += datum.value;
      hasOther = true;
    } else {
      named.push(datum);
    }
  }

  const series: ChartSeries[] = named.map((datum, index) => ({
    ...datum,
    key: `series-${index}`,
    color: SERIES_COLORS[index] ?? OTHER_COLOR,
  }));

  if (hasOther) {
    series.push({ label: CHART.other, value: otherValue, other: true, key: "other", color: OTHER_COLOR });
  }

  return series;
};
