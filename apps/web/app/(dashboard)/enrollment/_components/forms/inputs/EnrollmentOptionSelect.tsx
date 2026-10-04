"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/selects/Select";
import type { EnrollmentOption } from "../../../_types/enrollment.types";

type EnrollmentOptionSelectProps = {
  id: string;
  value: string;
  options: EnrollmentOption[];
  onValueChange: (value: string) => void;
  onBlur: () => void;
  invalid?: boolean;
};

// Groupe, politique ou réseau Wi-Fi : une liste de choix venus du serveur, la valeur est l'id.
export const EnrollmentOptionSelect = ({ id, value, options, onValueChange, onBlur, invalid }: EnrollmentOptionSelectProps) => (
  <Select
    value={value}
    items={options}
    onValueChange={(next) => {
      if (typeof next === "string") onValueChange(next);
    }}
  >
    <SelectTrigger id={id} className="w-full" onBlur={onBlur} aria-invalid={invalid}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
