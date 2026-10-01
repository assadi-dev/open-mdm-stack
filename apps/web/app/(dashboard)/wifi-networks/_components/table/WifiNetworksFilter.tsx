"use client";

import { useState } from "react";
import { Checkbox } from "@/components/checkboxes/Checkbox";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/fields/Field";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import type { DataTableController } from "@/hooks/useDataTable";
import { WIFI_SECURITY_KEYS } from "../../_dto/wifi-network.dto";
import type { WifiNetwork, WifiSecurity } from "../../_types/wifi-network.types";

// L'id de la colonne, le paramètre de l'API et la clé du parser nuqs (`useWifiNetworksTable`).
const SECURITY_FILTER = "security";
const NO_SECURITY: WifiSecurity[] = [];

type WifiNetworksFilterProps = {
  dataTable: DataTableController<WifiNetwork>;
};

// Le seul filtre de l'API : un ou plusieurs types de sécurité (`security=WPA2,WPA3`).
// Les cases modifient un brouillon ; le tableau (donc l'URL) ne change qu'à « Appliquer ».
export const WifiNetworksFilter = ({ dataTable }: WifiNetworksFilterProps) => {
  const { filters } = dataTable;
  const applied = filters.getValue<WifiSecurity[]>(SECURITY_FILTER) ?? NO_SECURITY;
  const [draft, setDraft] = useState<WifiSecurity[]>(applied);

  // Rebâti dans l'ordre de la liste : l'URL ne dépend pas de l'ordre des clics.
  const toggle = (security: WifiSecurity, checked: boolean) =>
    setDraft(WIFI_SECURITY_KEYS.filter((key) => (key === security ? checked : draft.includes(key))));

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
      onOpen={() => setDraft(applied)}
      onApply={() => filters.setValue(SECURITY_FILTER, draft)}
      onReset={reset}
    >
      <FieldSet>
        <FieldLegend variant="label">{WIFI_NETWORK.filters.security.label}</FieldLegend>
        <FieldGroup className="gap-0">
          {WIFI_SECURITY_KEYS.map((security) => (
            <Field key={security} orientation="horizontal">
              <Checkbox
                id={`wifi-security-${security}`}
                checked={draft.includes(security)}
                onCheckedChange={(checked) => toggle(security, checked)}
              />
              <FieldLabel htmlFor={`wifi-security-${security}`} className="w-full cursor-pointer py-2">
                {WIFI_NETWORK.security[security]}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
    </DataTableFilter>
  );
};
