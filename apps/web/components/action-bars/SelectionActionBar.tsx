"use client";

import { Children, type ReactNode } from "react";
import { X } from "lucide-react";
import { ACTION_BAR } from "@/constants/action-bar";
import { formatNumber } from "@/lib/format";
import { ActionBar, ActionBarClose, ActionBarGroup, ActionBarSelection, ActionBarSeparator } from "./ActionBar";

type SelectionLabels = {
  one: string;
  many: string;
  clear: string;
};

type SelectionActionBarProps = {
  selectedCount: number;
  onClear: () => void;
  // Les actions de la sélection, dans l'ordre d'affichage. Chacune rend un `ActionBarItem` (`./ActionBar`) :
  // la barre gère le focus et les flèches entre ses items, et se ferme (sélection vidée) après le clic.
  // Pour garder la barre ouverte (ex. une confirmation), l'action appelle `event.preventDefault()` dans `onSelect`.
  actions?: ReactNode[];
  labels?: SelectionLabels;
};

// Barre flottante en bas de l'écran, ouverte dès qu'un élément est sélectionné. La croix, Échap ou une action vident la sélection.
export const SelectionActionBar = ({
  selectedCount,
  onClear,
  actions = [],
  labels = ACTION_BAR.selection,
}: SelectionActionBarProps) => (
  <ActionBar
    open={selectedCount > 0}
    onOpenChange={(open) => {
      if (!open) onClear();
    }}
  >
    <ActionBarSelection>
      {`${formatNumber(selectedCount)} ${selectedCount > 1 ? labels.many : labels.one}`}
      <ActionBarSeparator />
      <ActionBarClose aria-label={labels.clear}>
        <X />
      </ActionBarClose>
    </ActionBarSelection>
    {actions.length > 0 && (
      <>
        <ActionBarSeparator />
        <ActionBarGroup>{Children.toArray(actions)}</ActionBarGroup>
      </>
    )}
  </ActionBar>
);
