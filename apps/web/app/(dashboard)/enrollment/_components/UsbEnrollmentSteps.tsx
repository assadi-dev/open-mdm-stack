import type { ComponentProps } from "react";
import { Download, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/items/Item";
import { ENROLLMENT } from "@/constants/enrollment";
import { cn } from "@/lib/utils";
import { USB_STEPS } from "../_services/enrollment.utils";
import type { UsbStep, UsbStepStatus, UsbStepStatuses } from "../_types/enrollment.types";

const STEP_ICONS: Record<UsbStep, LucideIcon> = {
  install: Download,
  enroll: Send,
  deviceOwner: ShieldCheck,
};

// Vocabulaire fixe de la charte : « En cours » en info, « Terminé » en succès.
const STATUS_VARIANTS: Record<UsbStepStatus, ComponentProps<typeof Badge>["variant"]> = {
  todo: "secondary",
  running: "info",
  done: "success",
};

// Le fond dit où en est l'étape : celle qui a le focus (en cours, ou la prochaine à faire) est en couleur primaire,
// une étape terminée en succès, les autres restent neutres.
const STEP_BACKGROUNDS = {
  current: "border-primary/40 bg-primary-soft",
  done: "bg-success-soft",
  todo: "bg-muted",
} as const;

type UsbEnrollmentStepsProps = {
  statuses: UsbStepStatuses;
  // Absente une fois toutes les étapes terminées.
  currentStep: UsbStep | null;
};

export const UsbEnrollmentSteps = ({ statuses, currentStep }: UsbEnrollmentStepsProps) => (
  <ItemGroup>
    {USB_STEPS.map((step) => {
      const Icon = STEP_ICONS[step];
      const text = ENROLLMENT.usb.steps[step];
      const status = statuses[step];
      const isCurrent = step === currentStep;
      const background = isCurrent ? "current" : status === "done" ? "done" : "todo";

      return (
        <Item key={step} size="sm" className={cn(STEP_BACKGROUNDS[background])} aria-current={isCurrent ? "step" : undefined}>
          <ItemMedia variant="icon">
            <Icon aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{text.title}</ItemTitle>
            <ItemDescription>{text.description}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge variant={STATUS_VARIANTS[status]}>{ENROLLMENT.usb.stepStatus[status]}</Badge>
          </ItemActions>
        </Item>
      );
    })}
  </ItemGroup>
);
