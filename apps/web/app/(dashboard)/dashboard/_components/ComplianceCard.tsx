"use client";

import { CardContent } from "@/components/cards/Card";
import { CardOptionsButton } from "@/components/cards/CardOptionsButton";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { ChartPieGauge } from "@/components/charts/ChartPieGauge";
import { DASHBOARD } from "@/constants/dashboard";
import { useFetchCompliance } from "../_hooks/useFetchCompliance";
import { toComplianceGauge } from "../_services/dashboard.utils";

export const ComplianceCard = () => {
  const { data, isPending, isError, refetch } = useFetchCompliance();
  const gauge = data ? toComplianceGauge(data) : undefined;

  return (
    <SectionCard
      title={DASHBOARD.compliance.title}
      description={DASHBOARD.compliance.description}
      action={<CardOptionsButton />}
    >
      <CardQueryState isPending={isPending} isError={isError} onRetry={() => refetch()} skeletonClassName="h-36">
        {gauge && (
          <CardContent className="my-auto flex grow items-center justify-center">
            <ChartPieGauge
              value={gauge.value}
              valueLabel={gauge.valueLabel}
              caption={gauge.caption}
              label={DASHBOARD.compliance.chartLabel}
              size={250}
            />
          </CardContent>
        )}
      </CardQueryState>
    </SectionCard>
  );
};
