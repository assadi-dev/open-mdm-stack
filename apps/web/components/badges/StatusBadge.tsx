import type { ComponentProps } from "react";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types/status";

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, "variant"> & {
  tone: StatusTone;
};

export const StatusBadge = ({ tone, children, ...props }: StatusBadgeProps) => (
  <Badge variant={tone} {...props}>
    <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", DOT_CLASSES[tone])} />
    {children}
  </Badge>
);
