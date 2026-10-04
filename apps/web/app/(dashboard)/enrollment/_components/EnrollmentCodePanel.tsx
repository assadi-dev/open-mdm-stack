"use client";

import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { CardErrorState } from "@/components/cards/CardQueryState";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { ENROLLMENT } from "@/constants/enrollment";
import { useCopyText } from "../_hooks/useCopyText";
import { useEnrollmentMutation } from "../_hooks/useEnrollmentMutation";
import { useFetchEnrollmentCode } from "../_hooks/useFetchEnrollmentCode";
import { formatEnrollmentCode } from "../_services/enrollment.utils";
import { ExpiryBadge } from "./ExpiryBadge";

// Le code à 6 chiffres que l'agent demande à l'ouverture, avec de quoi le copier ou en générer un nouveau.
export const EnrollmentCodePanel = () => {
  const { data: enrollmentCode, isPending, isError, refetch } = useFetchEnrollmentCode();
  const { regenerateCode } = useEnrollmentMutation();
  const copyText = useCopyText();

  if (isPending) return <Skeleton className="h-40 w-full rounded-lg" />;
  if (isError) return <CardErrorState onRetry={() => refetch()} />;

  return (
    <div className="relative flex justify-center rounded-lg border border-card-border bg-card-strong px-4 pt-16 pb-6 sm:px-24 sm:pt-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[0.8125rem] font-medium text-muted-foreground">{ENROLLMENT.noUsb.code.label}</span>
        <span className="text-[2rem] leading-9.5 font-semibold tracking-[6px] tabular-nums">{formatEnrollmentCode(enrollmentCode.code)}</span>
        <ExpiryBadge expiresAt={enrollmentCode.expiresAt} />
      </div>
      <div className="absolute top-3 right-3 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => regenerateCode.mutate()}
          disabled={regenerateCode.isPending}
          aria-label={ENROLLMENT.button.regenerateCode}
        >
          <RefreshCw aria-hidden="true" className={regenerateCode.isPending ? "animate-spin" : undefined} />
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
