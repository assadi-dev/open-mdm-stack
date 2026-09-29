import type { ComponentProps } from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Checkbox = ({ className, ...props }: ComponentProps<typeof ShadcnCheckbox>) => (
  <ShadcnCheckbox
    className={cn(
      "border-[1.5px] border-muted-foreground bg-card-strong data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current data-indeterminate:[&_svg]:hidden",
      className,
    )}
    {...props}
  />
);
