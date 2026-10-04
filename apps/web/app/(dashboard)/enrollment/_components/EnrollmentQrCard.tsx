"use client";

import Image from "next/image";
import { Copy, Download, Info, LoaderCircle, Printer, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { SectionCard } from "@/components/cards/SectionCard";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/empty/Empty";
import { ENROLLMENT } from "@/constants/enrollment";
import { cn } from "@/lib/utils";
import { useEnrollmentQrActions } from "../_hooks/useEnrollmentQrActions";
import { toExpiryDate, toSvgDataUrl } from "../_services/enrollment.utils";
import type { EnrollmentQr } from "../_types/enrollment.types";
import { ExpiryBadge } from "./ExpiryBadge";

const QR_SIZE = 232;

type EnrollmentQrCardProps = {
  // Absent tant qu'aucun QR code n'a été généré.
  qr?: EnrollmentQr;
  isGenerating: boolean;
  // Faux tant que les choix du serveur, donc le formulaire, se chargent.
  canGenerate: boolean;
  onGenerate: () => void;
};

export const EnrollmentQrCard = ({ qr, isGenerating, canGenerate, onGenerate }: EnrollmentQrCardProps) => {
  const { download, print, copyLink } = useEnrollmentQrActions(qr);
  const { instructions, empty } = ENROLLMENT.qr;

  return (
    <SectionCard
      title={ENROLLMENT.qr.title}
      description={qr ? toExpiryDate(qr.expiresAt) : undefined}
      action={qr && <ExpiryBadge expiresAt={qr.expiresAt} />}
      className="min-w-0"
    >
      <CardContent className="flex flex-col items-center gap-6">
        {qr ? (
          <>
            {/* Le QR code est une des rares surfaces opaques de la charte : un fond blanc franc, lisible par tout lecteur.
                Pendant la régénération, l'ancien reste affiché, estompé. */}
            <div
              aria-busy={isGenerating}
              className={cn("rounded-lg bg-(--sand-0) p-3 transition-opacity", isGenerating && "opacity-50")}
            >
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
          </>
        ) : (
          // Rien n'est généré à l'ouverture : chaque QR code crée un jeton côté serveur, avec les réglages du formulaire.
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <QrCode aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{empty.title}</EmptyTitle>
              <EmptyDescription>{empty.description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={onGenerate} disabled={!canGenerate || isGenerating}>
                {isGenerating ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <QrCode aria-hidden="true" />}
                {ENROLLMENT.button.generateQr}
              </Button>
            </EmptyContent>
          </Empty>
        )}
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
    </SectionCard>
  );
};
