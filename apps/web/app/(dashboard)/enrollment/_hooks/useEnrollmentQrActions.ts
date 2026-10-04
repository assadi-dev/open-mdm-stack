import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { downloadSvg, printImage, toSvgDataUrl } from "../_services/enrollment.utils";
import type { EnrollmentQr } from "../_types/enrollment.types";

// Les actions sous le QR code : le télécharger et l'imprimer. Chacune peut échouer, chacune a son toast.
export const useEnrollmentQrActions = (qr?: EnrollmentQr) => {
  const download = () => {
    if (!qr) return;
    try {
      downloadSvg(qr.svg, ENROLLMENT.qr.fileName);
      toast.success(ENROLLMENT.success.downloadQr);
    } catch {
      toast.error(ENROLLMENT.error.downloadQr);
    }
  };

  // La boîte d'impression du navigateur fait office de confirmation : pas de toast de réussite.
  const print = async () => {
    if (!qr) return;
    try {
      await printImage(toSvgDataUrl(qr.svg), ENROLLMENT.qr.title);
    } catch {
      toast.error(ENROLLMENT.error.printQr);
    }
  };

  return { download, print };
};
