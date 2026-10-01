import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/dialogs/Dialog";

type ModalHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  // Le composant lucide lui-même (`icon={Wifi}`) : la pastille fixe sa taille.
  icon?: LucideIcon;
};

// En-tête d'un `Dialog` (formulaire). La marge droite laisse la place à la croix de fermeture.
export const ModalHeader = ({ title, description, icon: Icon }: ModalHeaderProps) => (
  <DialogHeader>
    <div className="flex w-full items-center gap-3 pr-8">
      {Icon && (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"
        >
          <Icon className="size-5" />
        </span>
      )}
      <DialogTitle>{title}</DialogTitle>
    </div>
    {description && <DialogDescription>{description}</DialogDescription>}
  </DialogHeader>
);
