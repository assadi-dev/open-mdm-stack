import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import {
  Sheet as ShadcnSheet,
  SheetClose as ShadcnSheetClose,
  SheetContent as ShadcnSheetContent,
  SheetDescription as ShadcnSheetDescription,
  SheetFooter as ShadcnSheetFooter,
  SheetHeader as ShadcnSheetHeader,
  SheetTitle as ShadcnSheetTitle,
  SheetTrigger as ShadcnSheetTrigger,
} from "@/components/ui/sheet";
import { ACTION_LABELS } from "@/constants/actions";
import { cn } from "@/lib/utils";

// Le bouton du fichier généré est le `Button` shadcn : on lui substitue notre wrapper pour garder rayon, hauteur et variantes.
type SheetCloseProps = ComponentProps<typeof ShadcnSheetClose> & Pick<ComponentProps<typeof Button>, "variant" | "size">;

export const SheetClose = ({ variant, size, ...props }: SheetCloseProps) => (
  <ShadcnSheetClose render={<Button variant={variant ?? "outline"} size={size ?? "default"} />} {...props} />
);

// La croix générée est remplacée par la nôtre (libellé en français, bouton de la charte). Un panneau du bas a les coins hauts arrondis.
export const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: ComponentProps<typeof ShadcnSheetContent>) => (
  <ShadcnSheetContent
    side={side}
    showCloseButton={false}
    className={cn("gap-0 p-0", side === "bottom" && "max-h-[85dvh] rounded-t-2xl", className)}
    {...props}
  >
    {children}
    {showCloseButton && (
      <SheetClose variant="ghost" size="icon-sm" aria-label={ACTION_LABELS.close} className="absolute top-3 right-3">
        <X />
      </SheetClose>
    )}
  </ShadcnSheetContent>
);

export const SheetTitle = ({ className, ...props }: ComponentProps<typeof ShadcnSheetTitle>) => (
  <ShadcnSheetTitle className={cn("text-lg leading-6 font-semibold tracking-[-0.3px]", className)} {...props} />
);

export const Sheet = ShadcnSheet;
export const SheetDescription = ShadcnSheetDescription;
export const SheetFooter = ShadcnSheetFooter;
export const SheetHeader = ShadcnSheetHeader;
export const SheetTrigger = ShadcnSheetTrigger;
