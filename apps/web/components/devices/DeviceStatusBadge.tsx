import { StatusBadge } from "@/components/badges/StatusBadge";
import { STATUS, type StatusKey } from "@/constants/status";

type DeviceStatusBadgeProps = {
  status: StatusKey;
};

export const DeviceStatusBadge = ({ status }: DeviceStatusBadgeProps) => (
  <StatusBadge tone={STATUS[status].tone}>{STATUS[status].label}</StatusBadge>
);
