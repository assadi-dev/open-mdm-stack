import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "./Badge";
import type { DeltaDirection, DeltaSentiment } from "@/types/delta";

const SENTIMENT_CLASSES: Record<DeltaSentiment, string> = {
  positive: "text-success-text",
  negative: "text-danger-text",
};

type DeltaBadgeProps = {
  direction: DeltaDirection;
  sentiment: DeltaSentiment;
  children: ReactNode;
};

export const DeltaBadge = ({ direction, sentiment, children }: DeltaBadgeProps) => {
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <Badge variant="secondary" className={SENTIMENT_CLASSES[sentiment]}>
      <Arrow />
      {children}
    </Badge>
  );
};
