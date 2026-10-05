// import { DeltaBadge } from "@/components/badges/DeltaBadge";
// import type { DeltaDirection, DeltaSentiment } from "@/types/delta";
import { Card, CardAction, CardDescription, CardHeader, CardTitle /* , CardFooter */ } from "./Card";
import { CardOptionsButton } from "./CardOptionsButton";

type StatCardProps = {
  label: string;
  value: string;
  // À rétablir avec les variations des indicateurs (l'API ne les fournit pas encore) :
  // hint: string;
  // delta: {
  //   label: string;
  //   direction: DeltaDirection;
  //   sentiment: DeltaSentiment;
  // };
};

export const StatCard = ({ label, value /* , hint, delta */ }: StatCardProps) => (
  <Card className="gap-4 py-5 has-data-[slot=card-footer]:pb-5">
    <CardHeader>
      <CardDescription className="leading-4.5 font-medium text-foreground">{label}</CardDescription>
      {/* La valeur de l'indicateur prend le style `display` de la charte (44/48, −1,2 px). */}
      <CardTitle className="text-[44px] leading-12 tracking-[-1.2px] tabular-nums">{value}</CardTitle>
      <CardAction>
        <CardOptionsButton />
      </CardAction>
    </CardHeader>
    {/* <CardFooter>
      <DeltaBadge direction={delta.direction} sentiment={delta.sentiment}>
        {delta.label}
      </DeltaBadge>
      <span className="text-xs leading-4.5 text-muted-foreground">{hint}</span>
    </CardFooter> */}
  </Card>
);
