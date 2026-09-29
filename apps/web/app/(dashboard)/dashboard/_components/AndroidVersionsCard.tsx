"use client";

import { CardContent } from "@/components/cards/Card";
import { CardOptionsButton } from "@/components/cards/CardOptionsButton";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { ChartPieDonutText } from "@/components/charts/ChartPieDonutText";
import { DASHBOARD } from "@/constants/dashboard";
import { useFetchAndroidVersions } from "../_hooks/useFetchAndroidVersions";
import { toAndroidDonut } from "../_services/dashboard.utils";

export const AndroidVersionsCard = () => {
  const { data, isPending, isError, refetch } = useFetchAndroidVersions();
  const donut = data ? toAndroidDonut(data) : undefined;

  return (
    <SectionCard
      title={DASHBOARD.android.title}
      description={DASHBOARD.android.description}
      action={<CardOptionsButton />}
    >
      <CardQueryState isPending={isPending} isError={isError} onRetry={() => refetch()} skeletonClassName="h-46">
        {donut && (
          <CardContent>
            <ChartPieDonutText
              data={donut.data}
              value={donut.value}
              caption={DASHBOARD.android.caption}
              label={DASHBOARD.android.chartLabel}
              size={184}
            />
          </CardContent>
        )}
      </CardQueryState>
    </SectionCard>
  );
};
