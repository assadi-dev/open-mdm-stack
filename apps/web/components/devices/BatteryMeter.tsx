import { Progress } from "@/components/progress/Progress";
import { DEVICE } from "@/constants/device";
import { formatPercent } from "@/lib/format";

type BatteryMeterProps = {
  value: number | null;
};

export const BatteryMeter = ({ value }: BatteryMeterProps) => {
  if (value === null) return <span className="text-muted-foreground">{DEVICE.battery.unknown}</span>;

  return (
    <div className="flex items-center gap-2.5">
      <Progress value={value} aria-label={DEVICE.battery.label} className="w-16" />
      <span className="tabular-nums">{formatPercent(value, 0)}</span>
    </div>
  );
};
