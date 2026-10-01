"use client";

import { authClient } from "@/lib/auth/auth-client";
import { PageHeader } from "../../_components/PageHeader";
import { useFetchDashboardKpis } from "../_hooks/useFetchDashboardKpis";
import { toAttentionSubtitle, toGreeting } from "../_services/dashboard.utils";

export const DashboardHeader = () => {
  const { data: session } = authClient.useSession();
  const { data: kpis } = useFetchDashboardKpis();

  return (
    <PageHeader
      title={toGreeting(session?.user.name)}
      subtitle={kpis ? toAttentionSubtitle(kpis.attentionDeviceCount) : undefined}
    />
  );
};
