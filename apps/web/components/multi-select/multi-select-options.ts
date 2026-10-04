import type { ComponentType } from "react";

export type MultiSelectOption = {
  label: string;
  // Unique dans toute la liste : c'est la valeur émise et la clé de l'item.
  value: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export type MultiSelectGroup = {
  heading: string;
  options: MultiSelectOption[];
};

export type MultiSelectOptions = MultiSelectOption[] | MultiSelectGroup[];

export const isGroupedOptions = (options: MultiSelectOptions): options is MultiSelectGroup[] =>
  options.some((option) => "heading" in option);

export const flattenOptions = (options: MultiSelectOptions): MultiSelectOption[] =>
  isGroupedOptions(options) ? options.flatMap((group) => group.options) : options;
