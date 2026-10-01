"use client";

import { type ComponentProps, type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { MULTI_SELECT } from "@/constants/multi-select";
import { cn } from "@/lib/utils";
import { flattenOptions, isGroupedOptions, type MultiSelectOptions } from "./multi-select-options";
import { MultiSelectChip } from "./MultiSelectChip";

const NO_VALUE: string[] = [];

// Forme attendue par Base UI pour un groupe : `value` est le titre, `items` les valeurs des options.
type ItemGroup = { value: string; items: string[] };

type MultiSelectProps = {
  options: MultiSelectOptions;
  // Contrôlé avec `value`, non contrôlé avec `defaultValue`.
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  emptyIndicator?: ReactNode;
  // Nombre de puces affichées dans le champ ; les suivantes sont résumées en « +N ».
  maxCount?: number;
  hideSelectAll?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
  popoverClassName?: string;
} & Pick<ComponentProps<typeof ComboboxChipsInput>, "id" | "onBlur" | "aria-label" | "aria-labelledby" | "aria-invalid">;

// Liste déroulante à choix multiples bâtie sur le Combobox de Base UI : le champ de recherche est dans le champ,
// à la suite des puces. Clavier, rôles ARIA, filtrage et annonces vocales sont ceux de Base UI.
export const MultiSelect = ({
  options,
  value,
  defaultValue = NO_VALUE,
  onValueChange,
  placeholder = MULTI_SELECT.placeholder,
  emptyIndicator = MULTI_SELECT.empty,
  maxCount = 3,
  hideSelectAll = false,
  disabled,
  name,
  className,
  popoverClassName,
  ...inputProps
}: MultiSelectProps) => {
  const anchor = useComboboxAnchor();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [search, setSearch] = useState("");

  const selected = value ?? internalValue;
  const flatOptions = useMemo(() => flattenOptions(options), [options]);
  const optionByValue = useMemo(() => new Map(flatOptions.map((option) => [option.value, option])), [flatOptions]);
  const selectableValues = useMemo(
    () => flatOptions.filter((option) => !option.disabled).map((option) => option.value),
    [flatOptions],
  );
  const items = useMemo<string[] | ItemGroup[]>(
    () =>
      isGroupedOptions(options)
        ? options.map((group) => ({ value: group.heading, items: group.options.map((option) => option.value) }))
        : flatOptions.map((option) => option.value),
    [options, flatOptions],
  );

  const change = (next: string[]) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  const renderItem = (itemValue: string) => {
    const option = optionByValue.get(itemValue);
    if (!option) return null;
    const Icon = option.icon;

    return (
      <ComboboxItem key={itemValue} value={itemValue} disabled={option.disabled}>
        {Icon && <Icon className="text-muted-foreground" />}
        {option.label}
      </ComboboxItem>
    );
  };

  const isAllSelected = selectableValues.every((selectableValue) => selected.includes(selectableValue));
  const showSelectAll = !hideSelectAll && !search && !isAllSelected;
  const showClear = selected.length > 0;

  return (
    <Combobox
      multiple
      items={items}
      itemToStringLabel={(item: string) => optionByValue.get(item)?.label ?? item}
      value={selected}
      onValueChange={change}
      onInputValueChange={setSearch}
      disabled={disabled}
      name={name}
    >
      <ComboboxChips
        ref={anchor}
        className={cn(
          "min-h-11.5 rounded-md bg-card-strong px-2.5 py-1.5 has-disabled:cursor-not-allowed has-disabled:opacity-50",
          className,
        )}
      >
        <ComboboxValue>
          {(values: string[]) => {
            const chips = values.flatMap((chipValue) => optionByValue.get(chipValue) ?? []);
            const hiddenCount = chips.length - maxCount;

            return (
              <>
                {chips.slice(0, maxCount).map((option) => (
                  <MultiSelectChip key={option.value} option={option} />
                ))}
                {hiddenCount > 0 && (
                  <span className="px-1 text-xs font-semibold text-muted-foreground">
                    <span aria-hidden="true">+{hiddenCount}</span>
                    <span className="sr-only">
                      {hiddenCount} {MULTI_SELECT.more}
                    </span>
                  </span>
                )}
                <ComboboxChipsInput
                  {...inputProps}
                  placeholder={values.length > 0 ? undefined : placeholder}
                  className="px-1.5 placeholder:text-subtle-foreground"
                />
              </>
            );
          }}
        </ComboboxValue>
        <ComboboxTrigger
          aria-label={MULTI_SELECT.open}
          tabIndex={-1}
          className="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center self-center rounded-md enabled:cursor-pointer"
        />
      </ComboboxChips>

      <ComboboxContent anchor={anchor} className={cn("rounded-md shadow-none ring-border", popoverClassName)}>
        <ComboboxEmpty>{emptyIndicator}</ComboboxEmpty>
        <ComboboxList>
          {isGroupedOptions(options)
            ? (group: ItemGroup) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
        {(showSelectAll || showClear) && (
          <div className="flex items-center justify-between gap-1 border-t border-border p-1">
            {!hideSelectAll && (
              <Button variant="ghost" size="sm" disabled={!showSelectAll} onClick={() => change(selectableValues)}>
                {MULTI_SELECT.selectAll}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="ml-auto" disabled={!showClear} onClick={() => change([])}>
              {MULTI_SELECT.clear}
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
};
