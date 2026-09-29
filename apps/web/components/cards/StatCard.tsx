import { DeltaBadge } from "@/components/badges/DeltaBadge";
import type { DeltaDirection, DeltaSentiment } from "@/types/delta";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";
import { CardOptionsButton } from "./CardOptionsButton";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  delta: {
    label: string;
    direction: DeltaDirection;
    sentiment: DeltaSentiment;
  };
};

export const StatCard = ({ label, value, hint, delta }: StatCardProps) => (
  <Card className="gap-4 py-5 has-data-[slot=card-footer]:pb-5">
    <CardHeader>
      <CardDescription className="leading-4.5 font-medium text-foreground">{label}</CardDescription>
      <CardTitle className="text-[32px] leading-9.5 tracking-[-0.8px] tabular-nums">{value}</CardTitle>
      <CardAction>
        <CardOptionsButton />
      </CardAction>
    </CardHeader>
    <CardFooter>
      <DeltaBadge direction={delta.direction} sentiment={delta.sentiment}>
        {delta.label}
      </DeltaBadge>
      <span className="text-xs leading-4.5 text-muted-foreground">{hint}</span>
    </CardFooter>
  </Card>
);
