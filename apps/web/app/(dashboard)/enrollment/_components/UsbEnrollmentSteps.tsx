import type { ComponentProps } from "react";
import { Download, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/items/Item";
import { ENROLLMENT } from "@/constants/enrollment";
import { USB_STEPS, toInstallStepDescription, toUsbStepStatus } from "../_services/enrollment.utils";
import type { UsbEnrollmentStatus, UsbStep, UsbStepStatus } from "../_types/enrollment.types";

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

type UsbEnrollmentStepsProps = {
  status: UsbEnrollmentStatus;
  agentVersion?: string;
};

export const UsbEnrollmentSteps = ({ status, agentVersion }: UsbEnrollmentStepsProps) => {
  const stepStatus = toUsbStepStatus(status);

  return (
    <ItemGroup>
      {USB_STEPS.map((step) => {
        const Icon = STEP_ICONS[step];
        const text = ENROLLMENT.usb.steps[step];
        const description = step === "install" && agentVersion ? toInstallStepDescription(agentVersion) : text.description;

        return (
          <Item key={step} size="sm">
            <ItemMedia variant="icon">
              <Icon aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{text.title}</ItemTitle>
              <ItemDescription>{description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant={STATUS_VARIANTS[stepStatus]}>{ENROLLMENT.usb.stepStatus[stepStatus]}</Badge>
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
};
