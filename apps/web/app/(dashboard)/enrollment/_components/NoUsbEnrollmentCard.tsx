import { ChevronLeft, Download, KeyRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { SectionCard } from "@/components/cards/SectionCard";
import { ENROLLMENT } from "@/constants/enrollment";
import { EnrollmentCodePanel } from "./EnrollmentCodePanel";
import { DeviceOwnerDialog } from "./modals/DeviceOwnerDialog";

const STEPS: { icon: LucideIcon; text: string }[] = [
  { icon: Download, text: ENROLLMENT.noUsb.steps.install },
  { icon: KeyRound, text: ENROLLMENT.noUsb.steps.enterCode },
];

type NoUsbEnrollmentCardProps = {
  // Absent tant que les choix du serveur se chargent.
  agentApkUrl?: string;
  // Revient à la connexion USB.
  onUseUsb: () => void;
};

export const NoUsbEnrollmentCard = ({ agentApkUrl, onUseUsb }: NoUsbEnrollmentCardProps) => (
  <SectionCard
    title={ENROLLMENT.noUsb.title}
    description={ENROLLMENT.noUsb.description}
    action={
      agentApkUrl && (
        <Button variant="secondary" size="sm" nativeButton={false} render={<a href={agentApkUrl} download />}>
          <Download aria-hidden="true" />
          {ENROLLMENT.button.downloadAgent}
        </Button>
      )
    }
  >
    <CardContent className="flex flex-col gap-6">
      <EnrollmentCodePanel />
      <ol className="flex flex-col gap-3">
        {STEPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-[0.8125rem] leading-4.5">
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ol>
      <DeviceOwnerDialog />
      <Button variant="ghost" size="sm" className="self-start" onClick={onUseUsb}>
        <ChevronLeft aria-hidden="true" />
        {ENROLLMENT.button.installWithUsb}
      </Button>
    </CardContent>
  </SectionCard>
);
