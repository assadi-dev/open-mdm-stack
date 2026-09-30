import { DEVICE } from "@/constants/device";
import { PageHeader } from "../../_components/PageHeader";
import { toDevicesSubtitle } from "../_services/devices.utils";
import type { DeviceTabCounts } from "../_types/device.types";

type DevicesHeaderProps = {
  counts?: DeviceTabCounts;
};

export const DevicesHeader = ({ counts }: DevicesHeaderProps) => (
  <PageHeader title={DEVICE.page.title} subtitle={counts ? toDevicesSubtitle(counts) : undefined} />
);
