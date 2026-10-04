import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import type { CopyAction } from "../_types/enrollment.types";

// Copier peut échouer (permission refusée, contexte non sécurisé) : un toast dans chaque cas.
export const useCopyText = () => async (text: string, action: CopyAction) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ENROLLMENT.success[action]);
  } catch {
    toast.error(ENROLLMENT.error[action]);
  }
};
