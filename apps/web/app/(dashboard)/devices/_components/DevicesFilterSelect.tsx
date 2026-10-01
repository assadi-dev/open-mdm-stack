import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/selects/Select";
import type { FilterOption } from "../_types/device.types";

type DevicesFilterSelectProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
};

export const DevicesFilterSelect = ({ label, value, options, onValueChange }: DevicesFilterSelectProps) => (
  <Select value={value} items={options} onValueChange={(next) => next !== null && onValueChange(next)}>
    <SelectTrigger size="sm" aria-label={label}>
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
