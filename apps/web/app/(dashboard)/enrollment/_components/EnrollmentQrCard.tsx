"use client";

import Image from "next/image";
import { Copy, Download, Info, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { ENROLLMENT } from "@/constants/enrollment";
import { useEnrollmentQrActions } from "../_hooks/useEnrollmentQrActions";
import { useFetchEnrollmentQr } from "../_hooks/useFetchEnrollmentQr";
import { toExpiryDate, toSvgDataUrl } from "../_services/enrollment.utils";
import { ExpiryBadge } from "./ExpiryBadge";

const QR_SIZE = 232;

export const EnrollmentQrCard = () => {
  const { data: qr, isPending, isError, refetch } = useFetchEnrollmentQr();
  const { download, print, copyLink } = useEnrollmentQrActions(qr);
  const { instructions } = ENROLLMENT.qr;

  return (
    <SectionCard
      title={ENROLLMENT.qr.title}
      description={qr ? toExpiryDate(qr.expiresAt) : undefined}
      action={qr && <ExpiryBadge expiresAt={qr.expiresAt} />}
      className="min-w-0"
    >
      <CardQueryState isPending={isPending} isError={isError} onRetry={() => refetch()} skeletonClassName="h-96">
        {qr && (
          <CardContent className="flex flex-col items-center gap-6">
            {/* Le QR code est une des rares surfaces opaques de la charte : un fond blanc franc, lisible par tout lecteur. */}
            <div className="rounded-lg bg-(--sand-0) p-3">
              <Image
                src={toSvgDataUrl(qr.svg)}
                alt={ENROLLMENT.qr.alt}
                width={QR_SIZE}
                height={QR_SIZE}
                unoptimized
                className="block"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 py-4">
              <Button variant="secondary" size="sm" onClick={download}>
                <Download aria-hidden="true" />
                {ENROLLMENT.button.downloadQr}
              </Button>
              <Button variant="secondary" size="sm" onClick={print}>
                <Printer aria-hidden="true" />
                {ENROLLMENT.button.printQr}
              </Button>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy aria-hidden="true" />
                {ENROLLMENT.button.copyLink}
              </Button>
            </div>
            <Alert variant="info" role="note">
              <Info aria-hidden="true" />
              <AlertTitle>{instructions.title}</AlertTitle>
              <AlertDescription className="text-[0.8125rem] leading-4.5">
                <ol className="flex flex-col gap-1">
                  {instructions.steps.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </CardQueryState>
    </SectionCard>
  );
};
