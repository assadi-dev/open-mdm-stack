import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { Button } from "@/components/buttons/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs/Tabs";
import { DEVICE } from "@/constants/device";
import { formatNumber } from "@/lib/format";
import { isDeviceTab } from "../_services/devices.utils";
import type { DeviceTab, DeviceTabCounts } from "../_types/device.types";

const ENROLLMENT_HREF = "/enrollment";

type DevicesActionsBarProps = {
  // `undefined` : le filtre `status` de l'URL ne correspond à aucun onglet, aucun n'est actif.
  tab?: DeviceTab;
  onTabChange: (tab: DeviceTab) => void;
  counts?: DeviceTabCounts;
};

export const DevicesActionsBar = ({ tab, onTabChange, counts }: DevicesActionsBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <Tabs className="max-w-full min-w-0" value={tab ?? null} onValueChange={(value) => isDeviceTab(value) && onTabChange(value)}>
      <TabsList className="max-w-full justify-start overflow-x-auto" aria-label={DEVICE.filters.tabsLabel}>
        {Object.entries(DEVICE.tabs).map(([id, label]) => (
          <TabsTrigger key={id} value={id}>
            {label}
            {counts && isDeviceTab(id) && <Badge variant="secondary">{formatNumber(counts[id])}</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
    <Button nativeButton={false} render={<Link href={ENROLLMENT_HREF} />}>
      <Plus />
      {DEVICE.button.create}
    </Button>
  </div>
);
