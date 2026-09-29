"use client";

import { StatusBadge } from "@/components/badges/StatusBadge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/items/Item";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { NAVIGATION } from "@/constants/navigation";
import { STATUS } from "@/constants/status";
import { formatNumber } from "@/lib/format";
import { useFetchShellStatus } from "../_hooks/useFetchShellStatus";

export const BrokerStatusItem = () => {
  const { data } = useFetchShellStatus();

  if (!data) return <Skeleton className="h-16.5 w-full rounded-lg" />;

  const { isOnline, connectedDeviceCount } = data.broker;
  const status = isOnline ? STATUS.online : STATUS.offline;

  return (
    <Item variant="muted" size="sm" className="px-4 py-3">
      <ItemContent>
        <ItemTitle>{NAVIGATION.broker.title}</ItemTitle>
        <ItemDescription>{`${formatNumber(connectedDeviceCount)} ${NAVIGATION.broker.connected}`}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </ItemActions>
    </Item>
  );
};
