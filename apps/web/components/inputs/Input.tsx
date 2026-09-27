import type { ComponentProps } from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }: ComponentProps<typeof ShadcnInput>) => (
  <ShadcnInput
    className={cn("h-11.5 rounded-md bg-card-strong px-4 placeholder:text-subtle-foreground", className)}
    {...props}
  />
);
