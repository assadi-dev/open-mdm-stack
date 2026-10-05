"use client";

import Image from "next/image";
import { Download, Info, LoaderCircle, Printer, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { Button } from "@/components/buttons/Button";
import { CardContent } from "@/components/cards/Card";
import { SectionCard } from "@/components/cards/SectionCard";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/empty/Empty";
import { ENROLLMENT } from "@/constants/enrollment";
import { cn } from "@/lib/utils";
import { useEnrollmentQrActions } from "../_hooks/useEnrollmentQrActions";
import { toSvgDataUrl } from "../_services/enrollment.utils";
import type { EnrollmentQr } from "../_types/enrollment.types";

// Le QR code de provisioning est dense (une centaine de modules de côté : le jeu d'extras Android est long) : à 232 px, un
// module ne fait que ~2,4 px et un téléphone peine à le lire sur un écran. Il se réduit sur mobile (`w-full`).
const QR_SIZE = 320;

type EnrollmentQrCardProps = {
  // Absent tant qu'aucun QR code n'a été généré.
  qr?: EnrollmentQr;
  isGenerating: boolean;
  // Faux tant que les choix du serveur, donc le formulaire, se chargent.
  canGenerate: boolean;
  onGenerate: () => void;
};

export const EnrollmentQrCard = ({ qr, isGenerating, canGenerate, onGenerate }: EnrollmentQrCardProps) => {
  const { download, print } = useEnrollmentQrActions(qr);
  const { instructions, empty } = ENROLLMENT.qr;

  return (
    <SectionCard title={ENROLLMENT.qr.title} className="min-w-0">
      <CardContent className="flex flex-col items-center gap-6">
        {qr ? (
          <>
            {/* Le QR code est une des rares surfaces opaques de la charte : un fond blanc franc, lisible par tout lecteur.
                Pendant la régénération, l'ancien reste affiché, estompé. */}
            <div
              aria-busy={isGenerating}
              className={cn("w-full max-w-86 rounded-lg bg-(--sand-0) p-3 transition-opacity", isGenerating && "opacity-50")}
            >
              <Image
                src={toSvgDataUrl(qr.svg)}
                alt={ENROLLMENT.qr.alt}
                width={QR_SIZE}
                height={QR_SIZE}
                unoptimized
                className="block h-auto w-full"
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
