import type { ComponentProps } from "react";
import { Button } from "@/components/buttons/Button";
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogMedia as ShadcnAlertDialogMedia,
  AlertDialogOverlay as ShadcnAlertDialogOverlay,
  AlertDialogPortal as ShadcnAlertDialogPortal,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const AlertDialogContent = ({ className, ...props }: ComponentProps<typeof ShadcnAlertDialogContent>) => (
  <ShadcnAlertDialogContent
    className={cn(
      "gap-4 rounded-2xl bg-background p-6 ring-card-border data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-110",
      className,
    )}
    {...props}
  />
);

export const AlertDialogHeader = ({ className, ...props }: ComponentProps<typeof ShadcnAlertDialogHeader>) => (
  <ShadcnAlertDialogHeader className={cn("flex flex-col place-items-start items-start gap-2 text-left", className)} {...props} />
);

// Le pied du fichier généré est une bande grisée qui déborde du padding : la charte le veut sur le fond de la boîte.
export const AlertDialogFooter = ({ className, ...props }: ComponentProps<typeof ShadcnAlertDialogFooter>) => (
  <ShadcnAlertDialogFooter className={cn("mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0", className)} {...props} />
);

export const AlertDialogTitle = ({ className, ...props }: ComponentProps<typeof ShadcnAlertDialogTitle>) => (
  <ShadcnAlertDialogTitle className={cn("text-lg leading-6 font-semibold tracking-[-0.3px]", className)} {...props} />
);

// Le bouton du fichier généré est le `Button` shadcn : on lui substitue notre wrapper pour garder rayon, hauteur et variantes.
export const AlertDialogCancel = ({ variant, size, ...props }: ComponentProps<typeof ShadcnAlertDialogCancel>) => (
  <ShadcnAlertDialogCancel render={<Button variant={variant ?? "outline"} size={size ?? "default"} />} {...props} />
);

export const AlertDialogAction = ({ className, ...props }: ComponentProps<typeof Button>) => (
  <Button data-slot="alert-dialog-action" className={className} {...props} />
);

export const AlertDialog = ShadcnAlertDialog;
export const AlertDialogDescription = ShadcnAlertDialogDescription;
export const AlertDialogMedia = ShadcnAlertDialogMedia;
export const AlertDialogOverlay = ShadcnAlertDialogOverlay;
export const AlertDialogPortal = ShadcnAlertDialogPortal;
export const AlertDialogTrigger = ShadcnAlertDialogTrigger;
