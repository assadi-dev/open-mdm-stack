import { DASHBOARD } from "@/constants/dashboard";
import { formatDelta, formatNumber, formatPercent } from "@/lib/format";
import type { ChartDatum, FlowDatum, FlowHighlight } from "@/types/chart";
import type { DeltaDirection, DeltaSentiment } from "@/types/delta";
import type { AndroidVersions, CommandsFlow, Compliance, Kpi } from "../_types/dashboard.types";

// Une hausse est favorable pour les appareils enrôlés ou en ligne, défavorable pour les non-conformes et les commandes en attente.
const HIGHER_IS_BETTER: Record<Kpi["id"], boolean> = {
  enrolled: true,
  online: true,
  nonCompliant: false,
  pendingCommands: false,
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const formatMonth = (month: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("fr-FR", { month: style, timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

export const toGreeting = (name?: string) => [DASHBOARD.page.greeting, name].filter(Boolean).join(", ");

export const toAttentionSubtitle = (count: number) => {
  if (count === 0) return DASHBOARD.attention.none;
  return `${formatNumber(count)} ${count > 1 ? DASHBOARD.attention.many : DASHBOARD.attention.one}`;
};

export const toStatCard = ({ id, value, delta, deltaUnit }: Kpi) => {
  const isIncrease = delta >= 0;
  const direction: DeltaDirection = isIncrease ? "up" : "down";
  const sentiment: DeltaSentiment = isIncrease === HIGHER_IS_BETTER[id] ? "positive" : "negative";

  return {
    label: DASHBOARD.kpi[id].label,
    value: formatNumber(value),
    hint: DASHBOARD.kpi[id].hint,
    delta: { label: formatDelta(delta, deltaUnit), direction, sentiment },
  };
};

export const toFlowChart = ({ months, highlightMonth }: CommandsFlow) => {
  const data: FlowDatum[] = months.map(({ month, count }) => ({
    label: capitalize(formatMonth(month, "short")),
    value: count,
  }));

  const total = months.reduce((sum, { count }) => sum + count, 0);
  const first = months.at(0);
  const last = months.at(-1);
  const description =
    first && last
      ? `${capitalize(formatMonth(first.month, "long"))} → ${formatMonth(last.month, "long")} ${last.month.slice(0, 4)} · ${formatNumber(total)} ${DASHBOARD.flow.total}`
      : "";

  const index = months.findIndex(({ month }) => month === highlightMonth);
  const current = months[index];
  const previous = months[index - 1];
  const highlight: FlowHighlight | undefined = current
    ? {
        index,
        top: `${formatNumber(current.count)} ${DASHBOARD.flow.commands}`,
        bottom:
          previous && previous.count > 0
            ? `${formatDelta(Math.round(((current.count - previous.count) / previous.count) * 100), "percent")} ${DASHBOARD.flow.versus} ${formatMonth(previous.month, "long")}`
            : undefined,
      }
    : undefined;

  return { data, highlight, description };
};

export const toComplianceGauge = ({ compliantCount, totalCount }: Compliance) => {
  const percent = (compliantCount / totalCount) * 100;

  return {
    value: Math.round(percent),
    valueLabel: formatPercent(percent, 0),
    caption: `${formatNumber(compliantCount)} ${DASHBOARD.compliance.compliantDevices}`,
  };
};

export const toAndroidDonut = ({ totalCount, versions }: AndroidVersions) => {
  const data: ChartDatum[] = versions.map(({ label, count, other }) => ({ label, value: count, other }));

  return { data, value: formatNumber(totalCount) };
};
