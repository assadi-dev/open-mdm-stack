"use client";

import { useMemo } from "react";
import { Field, FieldLabel } from "@/components/fields/Field";
import { MultiSelect } from "@/components/multi-select/MultiSelect";
import type { MultiSelectOption } from "@/components/multi-select/multi-select-options";
import { DEVICE } from "@/constants/device";

// Une entrée d'action, jamais cochée : la choisir vide le champ (tout cocher reviendrait à ne pas filtrer). Ce n'est pas
// une valeur du parc : le nom évite toute collision avec une marque ou un modèle.
const SHOW_ALL = "__show-all__";

type DevicesFilterFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
};

// Un champ du panneau « Filtrer » : plusieurs valeurs à la fois, parmi celles du parc. Les valeurs sortent dans l'ordre
// de la liste, pas dans celui des clics : l'URL ne dépend pas de l'ordre dans lequel on coche.
export const DevicesFilterField = ({ id, label, placeholder, options, value, onValueChange }: DevicesFilterFieldProps) => {
  const choices = useMemo(() => [{ value: SHOW_ALL, label: DEVICE.filters.showAll }, ...options], [options]);

  const change = (next: string[]) =>
    onValueChange(next.includes(SHOW_ALL) ? [] : options.flatMap(({ value: option }) => (next.includes(option) ? [option] : [])));

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <MultiSelect id={id} options={choices} value={value} onValueChange={change} placeholder={placeholder} hideSelectAll />
    </Field>
  );
};
