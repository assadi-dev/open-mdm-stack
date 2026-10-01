"use client";

import type { ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/popovers/Popover";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/sheets/Sheet";
import { DATA_TABLE } from "@/constants/data-table";
import { useIsMobile } from "@/hooks/use-mobile";

type DataTableFilterProps = {
  // Libellé du bouton déclencheur (« Filtrer »).
  label: string;
  // Nombre de valeurs cochées (`dataTable.filters.activeCount`) : le badge du bouton, seul indice que le tableau est filtré.
  activeCount: number;
  onReset: () => void;
  // Les champs de filtre de la page. Ils s'appliquent en direct : l'état est dans l'URL, pas de bouton « Appliquer ».
  children: ReactNode;
};

// Le bouton « Filtrer » d'un tableau : un popover ancré au bouton sur desktop, un panneau qui monte du bas sur mobile.
// Le contenu est le même des deux côtés ; seule la coquille change.
export const DataTableFilter = ({ label, activeCount, onReset, children }: DataTableFilterProps) => {
  const isMobile = useIsMobile();

  const trigger = (
    <Button variant="secondary" size="sm">
      <ListFilter />
      {label}
      {activeCount > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
          {activeCount}
          <span className="sr-only">{DATA_TABLE.filter.active}</span>
        </span>
      )}
    </Button>
  );

  const resetButton = (
    <Button variant="ghost" size="sm" disabled={activeCount === 0} onClick={onReset}>
      {DATA_TABLE.filter.reset}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom">
          <SheetHeader className="p-5 pr-14">
            <SheetTitle>{DATA_TABLE.filter.title}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
          <SheetFooter className="flex-row justify-between border-t border-border p-4">
            {resetButton}
            <SheetClose variant="default">{DATA_TABLE.filter.done}</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{DATA_TABLE.filter.title}</PopoverTitle>
        </PopoverHeader>
        {children}
        <div className="-mb-1 flex justify-end">{resetButton}</div>
      </PopoverContent>
    </Popover>
  );
};
