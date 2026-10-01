import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@/components/dialogs/AlertDialog";
import { ACTION_LABELS } from "@/constants/actions";

// Pied d'une modale qui contient un formulaire : à placer dans le `<form>`, le bouton principal le soumet.
type ModalFormFooterProps = {
  labelSubmit: string;
  // Remplace `labelSubmit` pendant l'envoi ; sans lui, le libellé ne change pas.
  labelSubmitting?: string;
  labelCancel?: string;
  isLoading?: boolean;
};

export const ModalFormFooter = ({
  labelSubmit,
  labelSubmitting,
  labelCancel = ACTION_LABELS.cancel,
  isLoading = false,
}: ModalFormFooterProps) => (
  <AlertDialogFooter>
    <AlertDialogCancel>{labelCancel}</AlertDialogCancel>
    <AlertDialogAction type="submit" disabled={isLoading}>
      {isLoading ? (labelSubmitting ?? labelSubmit) : labelSubmit}
    </AlertDialogAction>
  </AlertDialogFooter>
);
