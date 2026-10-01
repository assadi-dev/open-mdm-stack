import type { ComponentProps } from "react";
import {
  Alert as ShadcnAlert,
  AlertAction as ShadcnAlertAction,
  AlertDescription as ShadcnAlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ShadcnAlertProps = ComponentProps<typeof ShadcnAlert>;
type AlertStatus = "success" | "warning" | "info";
type AlertVariant = NonNullable<ShadcnAlertProps["variant"]> | AlertStatus;
type AlertProps = Omit<ShadcnAlertProps, "variant"> & {
  variant?: AlertVariant;
};

const STATUS_CLASSES: Record<AlertStatus, string> = {
  success:
    "border-transparent bg-success-soft text-foreground *:[svg]:text-success-text *:data-[slot=alert-description]:text-foreground",
  warning:
    "border-transparent bg-warning-soft text-foreground *:[svg]:text-warning-text *:data-[slot=alert-description]:text-foreground",
  info: "border-transparent bg-info-soft text-foreground *:[svg]:text-info-text *:data-[slot=alert-description]:text-foreground",
};

const isStatus = (variant: AlertVariant): variant is AlertStatus => variant in STATUS_CLASSES;

export const Alert = ({ variant = "default", className, ...props }: AlertProps) => (
  <ShadcnAlert
    variant={isStatus(variant) ? "default" : variant}
    className={cn(
      "border-card-border px-4 py-3 has-[>svg]:gap-x-3 *:[svg:not([class*='size-'])]:size-4.5",
      isStatus(variant) && STATUS_CLASSES[variant],
      className,
    )}
    {...props}
  />
);

export const AlertTitle = ({ className, ...props }: ComponentProps<typeof ShadcnAlertTitle>) => (
  <ShadcnAlertTitle className={cn("font-semibold", className)} {...props} />
);

export const AlertDescription = ShadcnAlertDescription;
export const AlertAction = ShadcnAlertAction;
