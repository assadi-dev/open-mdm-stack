"use client";

import { Copy, KeyRound, LoaderCircle, RefreshCw } from "lucide-react";
import { ExpiryBadge } from "@/components/badges/ExpiryBadge";
import { Button } from "@/components/buttons/Button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/empty/Empty";
import { ENROLLMENT } from "@/constants/enrollment";
import { useCopyText } from "../_hooks/useCopyText";
import { useEnrollmentCode } from "../_hooks/useEnrollmentCode";
import { useEnrollmentMutation } from "../_hooks/useEnrollmentMutation";

// Le code à 6 chiffres que l'agent demande à l'ouverture, avec de quoi le copier ou en générer un nouveau.
export const EnrollmentCodePanel = () => {
  const enrollmentCode = useEnrollmentCode();
  const { generateCode } = useEnrollmentMutation();
  const copyText = useCopyText();
  const { code } = ENROLLMENT.noUsb;

  // Rien n'est généré à l'ouverture, comme pour le QR code : chaque code crée une entrée côté serveur.
  if (!enrollmentCode) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRound aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{code.empty.title}</EmptyTitle>
          <EmptyDescription>{code.empty.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => generateCode.mutate()} disabled={generateCode.isPending}>
            {generateCode.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <KeyRound aria-hidden="true" />}
            {ENROLLMENT.button.generateCode}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="relative flex justify-center rounded-lg border border-card-border bg-card-strong px-4 pt-16 pb-6 sm:px-24 sm:pt-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[0.8125rem] font-medium text-muted-foreground">{code.label}</span>
        <span className="text-[2rem] leading-9.5 font-semibold tracking-[6px] tabular-nums">{enrollmentCode.code}</span>
        <ExpiryBadge expiresAt={enrollmentCode.expiresAt} expiredLabel={code.expired} />
      </div>
      <div className="absolute top-3 right-3 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => generateCode.mutate()}
          disabled={generateCode.isPending}
          aria-label={ENROLLMENT.button.regenerateCode}
        >
          <RefreshCw aria-hidden="true" className={generateCode.isPending ? "animate-spin" : undefined} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => void copyText(enrollmentCode.code, "copyCode")}
          aria-label={ENROLLMENT.button.copyCode}
        >
          <Copy aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
