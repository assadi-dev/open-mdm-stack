import { Button } from "@/components/buttons/Button";
import { DialogClose, DialogFooter } from "@/components/dialogs/Dialog";
import { ACTION_LABELS } from "@/constants/actions";

// Pied d'un `Dialog` qui contient un formulaire : à placer dans le `<form>`, le bouton principal le soumet.
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
  <DialogFooter>
    <DialogClose>{labelCancel}</DialogClose>
    <Button type="submit" disabled={isLoading}>
      {isLoading ? (labelSubmitting ?? labelSubmit) : labelSubmit}
    </Button>
  </DialogFooter>
);
