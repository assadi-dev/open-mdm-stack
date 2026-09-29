"use client";

import { AndroidVersionsCard } from "./AndroidVersionsCard";
import { CommandsFlowCard } from "./CommandsFlowCard";
import { ComplianceCard } from "./ComplianceCard";
import { DashboardHeader } from "./DashboardHeader";
import { KpiSection } from "./KpiSection";
import { RecentDevicesCard } from "./RecentDevicesCard";

export const DashboardPageClient = () => (
  <>
    <DashboardHeader />
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1.45fr]">
      <KpiSection className="xl:col-span-2" />
      <CommandsFlowCard />
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <ComplianceCard />
      <AndroidVersionsCard />
    </div>
    <RecentDevicesCard />
  </>
);
