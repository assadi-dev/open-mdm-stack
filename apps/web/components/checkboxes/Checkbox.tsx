import type { ComponentProps } from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Checkbox = ({ className, ...props }: ComponentProps<typeof ShadcnCheckbox>) => (
  <ShadcnCheckbox className={cn("border-[1.5px] border-muted-foreground bg-card-strong", className)} {...props} />
);
