import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/dialogs/AlertDialog";

type ModalHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  // Le composant lucide lui-même (`icon={Wifi}`) : la pastille fixe sa taille.
  icon?: LucideIcon;
};

export const ModalHeader = ({ title, description, icon: Icon }: ModalHeaderProps) => (
  <AlertDialogHeader>
    <div className="flex w-full items-center gap-3">
      {Icon && (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"
        >
          <Icon className="size-5" />
        </span>
      )}
      <AlertDialogTitle>{title}</AlertDialogTitle>
    </div>
    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
  </AlertDialogHeader>
);
