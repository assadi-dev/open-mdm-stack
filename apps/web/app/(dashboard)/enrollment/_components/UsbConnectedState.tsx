import { CircleCheck, LoaderCircle, Send, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { Button } from "@/components/buttons/Button";
import { ENROLLMENT } from "@/constants/enrollment";
import { toUsbDeviceMeta, toUsbDeviceName } from "../_services/enrollment.utils";
import type { UsbDevice, UsbEnrollmentStatus } from "../_types/enrollment.types";
import { UsbEnrollmentSteps } from "./UsbEnrollmentSteps";

type UsbConnectedStateProps = {
  device: UsbDevice;
  status: UsbEnrollmentStatus;
  isDisconnecting: boolean;
  agentVersion?: string;
  onEnroll: () => void;
  onDisconnect: () => void;
};

// Un appareil branché : ce qu'il est, les étapes de l'enrôlement, puis le bouton qui les lance.
export const UsbConnectedState = ({
  device,
  status,
  isDisconnecting,
  agentVersion,
  onEnroll,
  onDisconnect,
}: UsbConnectedStateProps) => {
  const isEnrolling = status === "enrolling";
  const isEnrolled = status === "enrolled";
  const { usb } = ENROLLMENT;

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-card-border bg-card-strong px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Smartphone aria-hidden="true" className="size-5.5 shrink-0 text-primary-text" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{toUsbDeviceName(device)}</span>
            <span className="truncate text-xs text-muted-foreground">{toUsbDeviceMeta(device)}</span>
          </div>
        </div>
        <StatusBadge tone="success">{usb.device.connected}</StatusBadge>
      </div>

      <UsbEnrollmentSteps status={status} agentVersion={agentVersion} />

      {isEnrolled && (
        <Alert variant="success" role="status">
          <CircleCheck aria-hidden="true" />
          <AlertTitle>{usb.enrolled.title}</AlertTitle>
          <AlertDescription className="text-[0.8125rem] leading-4.5">{usb.enrolled.description}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDisconnect} disabled={isEnrolling || isDisconnecting}>
          {isDisconnecting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
          {ENROLLMENT.button.disconnect}
        </Button>
        <Button onClick={onEnroll} disabled={isEnrolling || isEnrolled || isDisconnecting}>
          {isEnrolling ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
          {ENROLLMENT.button.enroll}
        </Button>
      </div>
    </>
  );
};
