import type { ComponentProps } from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ShadcnBadgeProps = ComponentProps<typeof ShadcnBadge>;
type BadgeStatus = "success" | "warning" | "danger" | "info";
type BadgeVariant = NonNullable<ShadcnBadgeProps["variant"]> | BadgeStatus;
type BadgeProps = Omit<ShadcnBadgeProps, "variant"> & {
  variant?: BadgeVariant;
};

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info-text",
};

const isStatus = (variant: BadgeVariant): variant is BadgeStatus => variant in STATUS_CLASSES;

export const Badge = ({ variant = "default", className, ...props }: BadgeProps) => (
  <ShadcnBadge
    variant={isStatus(variant) ? "secondary" : variant}
    className={cn(
      "h-6 gap-1.5 rounded-full px-2.5 py-1 font-semibold [&>svg]:size-3.5!",
      variant === "default" && "bg-primary-soft text-primary-text",
      isStatus(variant) && STATUS_CLASSES[variant],
      className,
    )}
    {...props}
  />
);
