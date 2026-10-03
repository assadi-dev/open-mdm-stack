"use client";

import { useRef, useState, type ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/popovers/Popover";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/sheets/Sheet";
import { DATA_TABLE } from "@/constants/data-table";
import { useIsMobile } from "@/hooks/use-mobile";

type DataTableFilterProps = {
  // Libellé du bouton déclencheur (« Filtrer »).
  label: string;
  // Nombre de valeurs appliquées (`dataTable.filters.activeCount`) : le badge du bouton, seul indice que le tableau est filtré.
  activeCount: number;
  // La page garde un brouillon : « Appliquer » le transmet au tableau, « Réinitialiser » le vide et l'applique.
  onApply: () => void;
  onReset: () => void;
  // Appelé à chaque ouverture : la page y recopie les filtres appliqués dans son brouillon.
  onOpen?: () => void;
  // Faux quand il n'y a rien à réinitialiser (ni filtre appliqué, ni valeur cochée).
  canReset: boolean;
  // Les champs de filtre de la page, liés à son brouillon.
  children: ReactNode;
};

type FilterActionsProps = {
  size: "default" | "sm";
  canReset: boolean;
  onApply: () => void;
  onReset: () => void;
};

// Appliquer au-dessus, Réinitialiser dessous, chacun sur toute la largeur.
const FilterActions = ({ size, canReset, onApply, onReset }: FilterActionsProps) => (
  <>
    <Button size={size} className="w-full" onClick={onApply}>
      {DATA_TABLE.filter.apply}
    </Button>
    <Button variant="outline" size={size} className="w-full" disabled={!canReset} onClick={onReset}>
      {DATA_TABLE.filter.reset}
    </Button>
  </>
);

// Le bouton « Filtrer » d'un tableau : un popover ancré au bouton sur desktop, un panneau qui monte du bas sur mobile.
// Le contenu est le même des deux côtés ; seule la coquille change. Les actions sont toujours en bas de la carte :
// colonne flex, contenu en haut, boutons en bas.
export const DataTableFilter = ({ label, activeCount, onApply, onReset, onOpen, canReset, children }: DataTableFilterProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  // À l'ouverture, le focus va sur la carte et non sur le premier champ : sur mobile, un champ de saisie ferait monter le clavier,
  // et un champ focalisé garde le premier Échap pour lui (il en faut alors deux pour fermer).
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) onOpen?.();
    setOpen(next);
  };
  const handleApply = () => {
    onApply();
    setOpen(false);
  };
  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  const trigger = (
    <Button variant="secondary" size="sm">
      <ListFilter />
      {label}
      {activeCount > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
          {activeCount}
          <span className="sr-only">{activeCount > 1 ? DATA_TABLE.filter.active.many : DATA_TABLE.filter.active.one}</span>
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger render={trigger} />
        <SheetContent ref={contentRef} initialFocus={contentRef} side="bottom" className="justify-between">
          <div className="flex min-h-0 flex-col">
            <SheetHeader className="p-5 pr-14">
              <SheetTitle>{DATA_TABLE.filter.title}</SheetTitle>
            </SheetHeader>
            {/* Le même espacement que dans le popover : une page qui a plusieurs champs ne les colle pas. */}
            <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-5">{children}</div>
          </div>
          <SheetFooter className="border-t border-border p-4">
            <FilterActions size="default" canReset={canReset} onApply={handleApply} onReset={handleReset} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent ref={contentRef} initialFocus={contentRef} className="justify-between">
        <div className="flex flex-col gap-3">
          <PopoverHeader>
            <PopoverTitle>{DATA_TABLE.filter.title}</PopoverTitle>
          </PopoverHeader>
          {children}
        </div>
        <div className="flex flex-col gap-2">
          <FilterActions size="sm" canReset={canReset} onApply={handleApply} onReset={handleReset} />
        </div>
      </PopoverContent>
    </Popover>
  );
};
