"use client";

import { ChevronRight, Globe, Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { Badge } from "@/components/badges/Badge";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { SectionCard } from "@/components/cards/SectionCard";
import { ENROLLMENT } from "@/constants/enrollment";
import { useUsbEnrollment } from "../_hooks/useUsbEnrollment";
import type { EnrollmentConfigFormValues } from "../_types/enrollment.types";
import { UsbConnectedState } from "./UsbConnectedState";
import { UsbIdleState } from "./UsbIdleState";

type UsbEnrollmentCardProps = {
  form: UseFormReturn<EnrollmentConfigFormValues>;
  // Absent tant que les choix du serveur se chargent.
  agentVersion?: string;
  // Remplace cette carte par l'installation avec le code à saisir dans l'agent.
  onInstallWithCode: () => void;
};

export const UsbEnrollmentCard = ({ form, agentVersion, onInstallWithCode }: UsbEnrollmentCardProps) => {
  const { device, status, isConnecting, connect, enroll, disconnect } = useUsbEnrollment(form, onInstallWithCode);
  const { usb } = ENROLLMENT;

  return (
    <SectionCard
      title={usb.title}
      description={usb.description}
      action={
        <Badge variant="secondary">
          <Globe aria-hidden="true" />
          {usb.browsers}
        </Badge>
      }
    >
      <CardContent className="flex flex-col gap-5">
        {device ? (
          <UsbConnectedState
            device={device}
            status={status}
            agentVersion={agentVersion}
            onEnroll={enroll}
            onDisconnect={disconnect}
          />
        ) : (
          <UsbIdleState isConnecting={isConnecting} onConnect={connect} />
        )}
        <Alert variant="info" role="note">
          <Info aria-hidden="true" />
          <AlertTitle>{usb.chromiumOnly.title}</AlertTitle>
          {/* Le bouton reste dans la description pour s'aligner sur le texte, à droite de l'icône. */}
          <AlertDescription className="flex flex-col gap-3 text-[0.8125rem] leading-4.5">
            <span>{usb.chromiumOnly.description}</span>
            <Button variant="secondary" size="sm" className="w-full" onClick={onInstallWithCode}>
              {ENROLLMENT.button.installWithCode}
              <ChevronRight aria-hidden="true" />
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </SectionCard>
  );
};
