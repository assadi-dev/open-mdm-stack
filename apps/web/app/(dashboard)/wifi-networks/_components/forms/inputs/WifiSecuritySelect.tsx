"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/selects/Select";
import { isWifiSecurity, SECURITY_OPTIONS } from "../../../_services/wifi-networks.utils";
import type { WifiSecurity } from "../../../_types/wifi-network.types";

type WifiSecuritySelectProps = {
  id: string;
  value: WifiSecurity;
  onValueChange: (security: WifiSecurity) => void;
  onBlur: () => void;
};

export const WifiSecuritySelect = ({ id, value, onValueChange, onBlur }: WifiSecuritySelectProps) => (
  <Select
    value={value}
    items={SECURITY_OPTIONS}
    onValueChange={(next) => {
      if (isWifiSecurity(next)) onValueChange(next);
    }}
  >
    <SelectTrigger id={id} className="w-full" onBlur={onBlur}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {SECURITY_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
