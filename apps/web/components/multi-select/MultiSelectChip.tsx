import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { X } from "lucide-react";
import { ComboboxChip } from "@/components/ui/combobox";
import { MULTI_SELECT } from "@/constants/multi-select";
import type { MultiSelectOption } from "./multi-select-options";

type MultiSelectChipProps = {
  option: MultiSelectOption;
};

// Une valeur cochée, affichée comme le `Badge` de la charte. Le bouton de retrait est posé ici plutôt que par
// `showRemove` de shadcn : ce dernier le rend sans nom accessible.
export const MultiSelectChip = ({ option }: MultiSelectChipProps) => {
  const Icon = option.icon;

  return (
    <ComboboxChip
      aria-label={option.label}
      showRemove={false}
      className="h-6 gap-1.5 rounded-full bg-primary-soft pr-1 pl-2.5 font-semibold text-primary-text [&_svg]:size-3.5"
    >
      {Icon && <Icon />}
      {option.label}
      <ComboboxPrimitive.ChipRemove
        aria-label={`${MULTI_SELECT.remove} ${option.label}`}
        className="flex size-4 cursor-pointer items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-primary/15 hover:opacity-100 disabled:cursor-not-allowed"
      >
        <X />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxChip>
  );
};
