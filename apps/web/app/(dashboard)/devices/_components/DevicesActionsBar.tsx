import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { Button } from "@/components/buttons/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs/Tabs";
import { DEVICE } from "@/constants/device";
import { formatNumber } from "@/lib/format";
import { isDeviceTab } from "../_services/devices.utils";
import type { DeviceTab, DeviceTabCounts } from "../_types/device.types";

const ENROLLMENT_HREF = "/enrollment";

type DevicesActionsBarProps = {
  tab: DeviceTab;
  onTabChange: (tab: DeviceTab) => void;
  counts?: DeviceTabCounts;
};

export const DevicesActionsBar = ({ tab, onTabChange, counts }: DevicesActionsBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <Tabs className="max-w-full min-w-0" value={tab} onValueChange={(value) => isDeviceTab(value) && onTabChange(value)}>
      <TabsList className="max-w-full justify-start overflow-x-auto" aria-label={DEVICE.filters.tabsLabel}>
        {Object.entries(DEVICE.tabs).map(([id, label]) => (
          <TabsTrigger key={id} value={id}>
            {label}
            {counts && isDeviceTab(id) && <Badge variant="secondary">{formatNumber(counts[id])}</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="icon" aria-label={DEVICE.button.export}>
        <Download />
      </Button>
      <Button nativeButton={false} render={<Link href={ENROLLMENT_HREF} />}>
        <Plus />
        {DEVICE.button.create}
      </Button>
    </div>
  </div>
);
