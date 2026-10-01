"use client";

import { Card } from "@/components/cards/Card";
import { CardErrorState } from "@/components/cards/CardQueryState";
import { StatCard } from "@/components/cards/StatCard";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { KPI_IDS } from "../_dto/dashboard.dto";
import { useFetchDashboardKpis } from "../_hooks/useFetchDashboardKpis";
import { toStatCard } from "../_services/dashboard.utils";
import { cn } from "@/lib/utils";

type KpiSectionProps = {
  className?: string;
};

export const KpiSection = ({ className }: KpiSectionProps) => {
  const { data, isPending, isError, refetch } = useFetchDashboardKpis();

  if (isError) {
    return (
      <Card className={className}>
        <CardErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", className)}>
      {isPending
        ? KPI_IDS.map((id) => <Skeleton key={id} className="h-40.5 rounded-xl" />)
        : data.items.map((kpi) => <StatCard key={kpi.id} {...toStatCard(kpi)} />)}
    </div>
  );
};
