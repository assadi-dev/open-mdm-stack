import type { ComponentProps } from "react";
import {
  Select as ShadcnSelect,
  SelectContent as ShadcnSelectContent,
  SelectGroup as ShadcnSelectGroup,
  SelectItem as ShadcnSelectItem,
  SelectLabel as ShadcnSelectLabel,
  SelectScrollDownButton as ShadcnSelectScrollDownButton,
  SelectScrollUpButton as ShadcnSelectScrollUpButton,
  SelectSeparator as ShadcnSelectSeparator,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const SelectTrigger = ({ className, ...props }: ComponentProps<typeof ShadcnSelectTrigger>) => (
  <ShadcnSelectTrigger
    className={cn(
      "rounded-md bg-card-strong px-4 data-[size=default]:h-11.5 data-[size=sm]:h-9 data-[size=sm]:rounded-md data-[size=sm]:px-3.5 data-[size=sm]:font-medium data-placeholder:text-subtle-foreground",
      className,
    )}
    {...props}
  />
);

export const SelectContent = ({ className, ...props }: ComponentProps<typeof ShadcnSelectContent>) => (
  <ShadcnSelectContent className={cn("rounded-md shadow-none ring-border", className)} {...props} />
);

export const SelectItem = ({ className, ...props }: ComponentProps<typeof ShadcnSelectItem>) => (
  <ShadcnSelectItem className={cn("rounded-sm py-2 pr-8 pl-2.5 focus:bg-primary-soft", className)} {...props} />
);

export const Select = ShadcnSelect;
export const SelectGroup = ShadcnSelectGroup;
export const SelectLabel = ShadcnSelectLabel;
export const SelectScrollDownButton = ShadcnSelectScrollDownButton;
export const SelectScrollUpButton = ShadcnSelectScrollUpButton;
export const SelectSeparator = ShadcnSelectSeparator;
export const SelectValue = ShadcnSelectValue;
