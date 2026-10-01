"use client";

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
export const WifiNetworksFilter = ({ dataTable }: WifiNetworksFilterProps) => {
  const { filters } = dataTable;
  const selected = filters.getValue<WifiSecurity[]>(SECURITY_FILTER) ?? NO_SECURITY;

  // Rebâtie dans l'ordre de la liste : l'URL ne dépend pas de l'ordre des clics.
  const toggle = (security: WifiSecurity, checked: boolean) =>
    filters.setValue(
      SECURITY_FILTER,
      WIFI_SECURITY_KEYS.filter((key) => (key === security ? checked : selected.includes(key))),
    );

  return (
    <DataTableFilter label={WIFI_NETWORK.button.filter} activeCount={filters.activeCount} onReset={filters.reset}>
      <FieldSet>
        <FieldLegend variant="label">{WIFI_NETWORK.filters.security.label}</FieldLegend>
        <FieldGroup className="gap-0">
          {WIFI_SECURITY_KEYS.map((security) => (
            <Field key={security} orientation="horizontal">
              <Checkbox
                id={`wifi-security-${security}`}
                checked={selected.includes(security)}
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
