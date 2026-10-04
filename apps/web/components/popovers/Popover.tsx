import type { ComponentProps } from "react";
import {
  Popover as ShadcnPopover,
  PopoverContent as ShadcnPopoverContent,
  PopoverHeader as ShadcnPopoverHeader,
  PopoverTitle as ShadcnPopoverTitle,
  PopoverTrigger as ShadcnPopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Même boîte que `DropdownMenuContent` : opaque (charte : `popover` est une surface de texte), sans ombre, contour `border`.
export const PopoverContent = ({ className, align = "end", ...props }: ComponentProps<typeof ShadcnPopoverContent>) => (
  <ShadcnPopoverContent align={align} className={cn("w-72 gap-3 p-4 shadow-none ring-border", className)} {...props} />
);

export const PopoverTitle = ({ className, ...props }: ComponentProps<typeof ShadcnPopoverTitle>) => (
  <ShadcnPopoverTitle className={cn("text-[0.9375rem] font-semibold", className)} {...props} />
);

export const Popover = ShadcnPopover;
export const PopoverHeader = ShadcnPopoverHeader;
export const PopoverTrigger = ShadcnPopoverTrigger;
