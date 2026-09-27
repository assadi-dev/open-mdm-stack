import type { ComponentProps } from "react";
import {
  Card as ShadcnCard,
  CardAction as ShadcnCardAction,
  CardContent as ShadcnCardContent,
  CardDescription as ShadcnCardDescription,
  CardFooter as ShadcnCardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: ComponentProps<typeof ShadcnCard>) => (
  <ShadcnCard className={cn("ring-card-border [--card-spacing:--spacing(6)]", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: ComponentProps<typeof ShadcnCardTitle>) => (
  <ShadcnCardTitle className={cn("text-lg font-semibold tracking-[-0.3px]", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: ComponentProps<typeof ShadcnCardDescription>) => (
  <ShadcnCardDescription className={cn("text-[13px]", className)} {...props} />
);

export const CardHeader = ShadcnCardHeader;
export const CardAction = ShadcnCardAction;
export const CardContent = ShadcnCardContent;
export const CardFooter = ShadcnCardFooter;
