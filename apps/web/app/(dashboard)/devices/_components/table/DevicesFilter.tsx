"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/checkboxes/Checkbox";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { Field, FieldLabel } from "@/components/fields/Field";
import { MultiSelect } from "@/components/multi-select/MultiSelect";
import type { MultiSelectOption } from "@/components/multi-select/multi-select-options";
import { DEVICE } from "@/constants/device";
import {
  NO_DEVICE_FILTERS,
  toAndroidLabel,
  toAndroidOptions,
  toValueOptions,
  withAppliedOptions,
} from "../../_services/devices.utils";
import type { DeviceFilterValues, DeviceSummary } from "../../_types/device.types";
import { DevicesFilterField } from "./DevicesFilterField";

const BRAND_FIELD_ID = "devices-brand-filter";
const MODEL_FIELD_ID = "devices-model-filter";
const GROUP_FIELD_ID = "devices-group-filter";
const ANDROID_FIELD_ID = "devices-android-filter";
const BLOCKED_FIELD_ID = "devices-blocked-filter";
const NO_OPTIONS: MultiSelectOption[] = [];
const NO_VALUES: string[] = [];

type DevicesFilterProps = {
  // Les choix viennent du résumé du parc ; tant qu'il charge, les listes sont vides.
  summary?: DeviceSummary;
  // Ce que le tableau applique déjà (l'URL).
  applied: DeviceFilterValues;
  // Une unité par valeur appliquée : le badge du bouton.
  activeCount: number;
  onApply: (values: DeviceFilterValues) => void;
  onReset: () => void;
};

// Le bouton « Filtrer » : la marque, le modèle et la version d'Android, plusieurs valeurs chacun, et les appareils bloqués
// seuls. Le groupe est grisé, en attendant que l'API en ait. Les champs modifient un brouillon ; le tableau (donc l'URL)
// ne change qu'à « Appliquer ».
export const DevicesFilter = ({ summary, applied, activeCount, onApply, onReset }: DevicesFilterProps) => {
  const [draft, setDraft] = useState<DeviceFilterValues>(applied);
  const { brand, model, group, android, blocked } = DEVICE.filters;

  const brandOptions = useMemo(() => withAppliedOptions(toValueOptions(summary?.brands ?? []), applied.brand), [summary, applied.brand]);
  const modelOptions = useMemo(() => withAppliedOptions(toValueOptions(summary?.models ?? []), applied.model), [summary, applied.model]);
  const androidOptions = useMemo(
    () => withAppliedOptions(summary ? toAndroidOptions(summary) : NO_OPTIONS, applied.sdkVersion, toAndroidLabel),
    [summary, applied.sdkVersion],
  );

  const hasDraft = draft.brand.length + draft.model.length + draft.sdkVersion.length > 0 || draft.blocked;

  const reset = () => {
    setDraft(NO_DEVICE_FILTERS);
    onReset();
  };

  return (
    <DataTableFilter
      label={DEVICE.button.filter}
      activeCount={activeCount}
      canReset={activeCount > 0 || hasDraft}
      // L'URL a pu changer pendant que le panneau était fermé (retour arrière, lien, onglet) : on repart de ce qui est appliqué.
      onOpen={() => setDraft(applied)}
      onApply={() => onApply(draft)}
      onReset={reset}
    >
      <DevicesFilterField
        id={BRAND_FIELD_ID}
        label={brand.label}
        placeholder={brand.placeholder}
        options={brandOptions}
        value={draft.brand}
        onValueChange={(value) => setDraft((current) => ({ ...current, brand: value }))}
      />
      <DevicesFilterField
        id={MODEL_FIELD_ID}
        label={model.label}
        placeholder={model.placeholder}
        options={modelOptions}
        value={draft.model}
        onValueChange={(value) => setDraft((current) => ({ ...current, model: value }))}
      />
      {/* Aucun groupe côté API : le champ est là pour annoncer le filtre, sans rien proposer. */}
      <Field data-disabled>
        <FieldLabel htmlFor={GROUP_FIELD_ID}>
          {group.label}
          <span className="font-normal text-muted-foreground">{group.soon}</span>
        </FieldLabel>
        <MultiSelect id={GROUP_FIELD_ID} options={NO_OPTIONS} value={NO_VALUES} placeholder={group.placeholder} hideSelectAll disabled />
      </Field>
      <DevicesFilterField
        id={ANDROID_FIELD_ID}
        label={android.label}
        placeholder={android.placeholder}
        options={androidOptions}
        value={draft.sdkVersion}
        onValueChange={(value) => setDraft((current) => ({ ...current, sdkVersion: value }))}
      />
      <Field orientation="horizontal">
        <Checkbox
          id={BLOCKED_FIELD_ID}
          checked={draft.blocked}
          onCheckedChange={(checked) => setDraft((current) => ({ ...current, blocked: checked }))}
        />
        <FieldLabel htmlFor={BLOCKED_FIELD_ID} className="font-normal">
          {blocked.label}
        </FieldLabel>
      </Field>
    </DataTableFilter>
  );
};
