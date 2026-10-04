import type { ComponentProps } from "react";
import {
  Empty as ShadcnEmpty,
  EmptyContent as ShadcnEmptyContent,
  EmptyDescription as ShadcnEmptyDescription,
  EmptyHeader as ShadcnEmptyHeader,
  EmptyMedia as ShadcnEmptyMedia,
  EmptyTitle as ShadcnEmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

// Le fichier généré pose `border-dashed` sans épaisseur : la charte veut le pointillé `border-strong` des zones vides.
export const Empty = ({ className, ...props }: ComponentProps<typeof ShadcnEmpty>) => (
  <ShadcnEmpty className={cn("gap-3 rounded-lg border border-border-strong px-4 py-5", className)} {...props} />
);

// L'icône dans un rond de verre dense, en orange texte (zone « Aucun appareil connecté » de la maquette).
export const EmptyMedia = ({ variant, className, ...props }: ComponentProps<typeof ShadcnEmptyMedia>) => (
  <ShadcnEmptyMedia
    variant={variant}
    className={cn(
      "mb-0",
      variant === "icon" && "size-12 rounded-full bg-card-strong text-primary-text [&_svg:not([class*='size-'])]:size-5.5",
      className,
    )}
    {...props}
  />
);

export const EmptyHeader = ({ className, ...props }: ComponentProps<typeof ShadcnEmptyHeader>) => (
  <ShadcnEmptyHeader className={cn("gap-1", className)} {...props} />
);

export const EmptyDescription = ({ className, ...props }: ComponentProps<typeof ShadcnEmptyDescription>) => (
  <ShadcnEmptyDescription className={cn("text-[0.8125rem] leading-4.5", className)} {...props} />
);

export const EmptyTitle = ShadcnEmptyTitle;
export const EmptyContent = ShadcnEmptyContent;
