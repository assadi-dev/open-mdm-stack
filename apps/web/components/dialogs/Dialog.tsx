import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import {
  Dialog as ShadcnDialog,
  DialogClose as ShadcnDialogClose,
  DialogContent as ShadcnDialogContent,
  DialogDescription as ShadcnDialogDescription,
  DialogFooter as ShadcnDialogFooter,
  DialogHeader as ShadcnDialogHeader,
  DialogOverlay as ShadcnDialogOverlay,
  DialogPortal as ShadcnDialogPortal,
  DialogTitle as ShadcnDialogTitle,
  DialogTrigger as ShadcnDialogTrigger,
} from "@/components/ui/dialog";
import { ACTION_LABELS } from "@/constants/actions";
import { cn } from "@/lib/utils";

// Le bouton du fichier généré est le `Button` shadcn : on lui substitue notre wrapper pour garder rayon, hauteur et variantes.
type DialogCloseProps = ComponentProps<typeof ShadcnDialogClose> & Pick<ComponentProps<typeof Button>, "variant" | "size">;

export const DialogClose = ({ variant, size, ...props }: DialogCloseProps) => (
  <ShadcnDialogClose render={<Button variant={variant ?? "outline"} size={size ?? "default"} />} {...props} />
);

// Même boîte que `AlertDialogContent`. La croix générée est remplacée par la nôtre, construite sur `DialogClose`.
export const DialogContent = ({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof ShadcnDialogContent>) => (
  <ShadcnDialogContent
    showCloseButton={false}
    className={cn("gap-4 rounded-2xl bg-background p-6 ring-card-border sm:max-w-110", className)}
    {...props}
  >
    {children}
    {showCloseButton && (
      <DialogClose variant="ghost" size="icon-sm" aria-label={ACTION_LABELS.close} className="absolute top-4 right-4">
        <X />
      </DialogClose>
    )}
  </ShadcnDialogContent>
);

// Le pied du fichier généré est une bande grisée qui déborde du padding : la charte le veut sur le fond de la boîte.
export const DialogFooter = ({ className, ...props }: ComponentProps<typeof ShadcnDialogFooter>) => (
  <ShadcnDialogFooter className={cn("mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: ComponentProps<typeof ShadcnDialogTitle>) => (
  <ShadcnDialogTitle className={cn("text-lg leading-6 font-semibold tracking-[-0.3px]", className)} {...props} />
);

type DialogProps = ComponentProps<typeof ShadcnDialog> & {
  /**
   * Un clic hors de la boîte ne la ferme plus : seuls la croix, « Annuler » et Échap la ferment.
   * À passer à `true` quand la boîte contient un formulaire, pour ne pas perdre la saisie.
   */
  disablePointerDismissal?: boolean;
};

export const Dialog = (props: DialogProps) => <ShadcnDialog {...props} />;

export const DialogDescription = ShadcnDialogDescription;
export const DialogHeader = ShadcnDialogHeader;
export const DialogOverlay = ShadcnDialogOverlay;
export const DialogPortal = ShadcnDialogPortal;
export const DialogTrigger = ShadcnDialogTrigger;
