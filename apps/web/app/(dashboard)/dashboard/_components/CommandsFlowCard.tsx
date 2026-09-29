"use client";

import { ArrowUpRight, ListFilter } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { ChartAreaFlow } from "@/components/charts/ChartAreaFlow";
import { DASHBOARD } from "@/constants/dashboard";
import { useFetchCommandsFlow } from "../_hooks/useFetchCommandsFlow";
import { toFlowChart } from "../_services/dashboard.utils";

export const CommandsFlowCard = () => {
  const { data, isPending, isError, refetch } = useFetchCommandsFlow();
  const chart = data ? toFlowChart(data) : undefined;

  return (
    <SectionCard
      titleSize="lg"
      title={DASHBOARD.flow.title}
      description={chart?.description}
      action={
        <>
          <Button variant="ink" size="icon-sm" aria-label={DASHBOARD.button.filter}>
            <ListFilter />
          </Button>
          <Button variant="secondary" size="icon-sm" aria-label={DASHBOARD.button.openReport}>
            <ArrowUpRight />
          </Button>
        </>
      }
    >
      <CardQueryState isPending={isPending} isError={isError} onRetry={() => refetch()} skeletonClassName="h-56">
        {chart && (
          <CardContent>
            <ChartAreaFlow data={chart.data} highlight={chart.highlight} height={150} label={DASHBOARD.flow.chartLabel} />
          </CardContent>
        )}
      </CardQueryState>
    </SectionCard>
  );
};
