"use client";

import { useState } from "react";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { Field, FieldLabel } from "@/components/fields/Field";
import { MultiSelect } from "@/components/multi-select/MultiSelect";
import type { MultiSelectOption } from "@/components/multi-select/multi-select-options";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import type { DataTableController } from "@/hooks/useDataTable";
import { WIFI_SECURITY_KEYS } from "../../_dto/wifi-network.dto";
import type { WifiNetwork, WifiSecurity } from "../../_types/wifi-network.types";

// L'id de la colonne, le paramètre de l'API et la clé du parser nuqs (`useWifiNetworksTable`).
const SECURITY_FILTER = "security";
const SECURITY_FIELD_ID = "wifi-security-filter";
const NO_SECURITY: WifiSecurity[] = [];
// Une entrée d'action, jamais cochée : la choisir vide la sélection (voir `changeDraft`). Ce n'est pas un type de sécurité.
const SHOW_ALL = "ALL";
// Les réseaux ouverts (NONE) ne sont pas proposés : « Aucune » se lirait « aucun filtre » dans cette liste.
const FILTERABLE_SECURITY = WIFI_SECURITY_KEYS.filter((security) => security !== "NONE");
const SECURITY_OPTIONS: MultiSelectOption[] = [
  { value: SHOW_ALL, label: WIFI_NETWORK.filters.security.showAll },
  ...FILTERABLE_SECURITY.map((security) => ({ value: security, label: WIFI_NETWORK.security[security] })),
];

// Ne garde que les types de la liste, dans son ordre : l'URL ne dépend pas de l'ordre des clics, et un type absent
// de la liste (ex. `?security=NONE` saisi à la main) ne reste pas dans le brouillon sans puce pour le retirer.
const toDraft = (values: string[]) => FILTERABLE_SECURITY.filter((security) => values.includes(security));

type WifiNetworksFilterProps = {
  dataTable: DataTableController<WifiNetwork>;
};

// Le seul filtre de l'API : un ou plusieurs types de sécurité (`security=WPA2,WPA3`).
// La liste modifie un brouillon ; le tableau (donc l'URL) ne change qu'à « Appliquer ».
export const WifiNetworksFilter = ({ dataTable }: WifiNetworksFilterProps) => {
  const { filters } = dataTable;
  const applied = filters.getValue<WifiSecurity[]>(SECURITY_FILTER) ?? NO_SECURITY;
  const [draft, setDraft] = useState<WifiSecurity[]>(() => toDraft(applied));

  // La liste émet des chaînes : « Afficher tout » vide la sélection.
  const changeDraft = (values: string[]) => setDraft(values.includes(SHOW_ALL) ? NO_SECURITY : toDraft(values));

  const reset = () => {
    setDraft(NO_SECURITY);
    filters.reset();
  };

  return (
    <DataTableFilter
      label={WIFI_NETWORK.button.filter}
      activeCount={filters.activeCount}
      canReset={filters.activeCount > 0 || draft.length > 0}
      // L'URL a pu changer pendant que le panneau était fermé (retour arrière, lien) : on repart de ce qui est appliqué.
      onOpen={() => setDraft(toDraft(applied))}
      onApply={() => filters.setValue(SECURITY_FILTER, draft)}
      onReset={reset}
    >
      <Field>
        <FieldLabel htmlFor={SECURITY_FIELD_ID}>{WIFI_NETWORK.filters.security.label}</FieldLabel>
        {/* Sélectionner tout revient à ne pas filtrer : « Tout sélectionner » n'a pas de sens ici. */}
        <MultiSelect
          id={SECURITY_FIELD_ID}
          options={SECURITY_OPTIONS}
          value={draft}
          onValueChange={changeDraft}
          placeholder={WIFI_NETWORK.filters.security.placeholder}
          hideSelectAll
        />
      </Field>
    </DataTableFilter>
  );
};
