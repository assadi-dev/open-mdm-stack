import type { ComponentProps } from "react";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuCheckboxItem as ShadcnDropdownMenuCheckboxItem,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuGroup as ShadcnDropdownMenuGroup,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuPortal as ShadcnDropdownMenuPortal,
  DropdownMenuRadioGroup as ShadcnDropdownMenuRadioGroup,
  DropdownMenuRadioItem as ShadcnDropdownMenuRadioItem,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuShortcut as ShadcnDropdownMenuShortcut,
  DropdownMenuSub as ShadcnDropdownMenuSub,
  DropdownMenuSubContent as ShadcnDropdownMenuSubContent,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenuContent = ({ className, ...props }: ComponentProps<typeof ShadcnDropdownMenuContent>) => (
  <ShadcnDropdownMenuContent className={cn("min-w-55 shadow-none ring-border", className)} {...props} />
);

export const DropdownMenuItem = ({ className, ...props }: ComponentProps<typeof ShadcnDropdownMenuItem>) => (
  <ShadcnDropdownMenuItem className={cn("rounded-sm px-2.5 py-2 focus:bg-primary-soft", className)} {...props} />
);

export const DropdownMenu = ShadcnDropdownMenu;
export const DropdownMenuCheckboxItem = ShadcnDropdownMenuCheckboxItem;
export const DropdownMenuGroup = ShadcnDropdownMenuGroup;
export const DropdownMenuLabel = ShadcnDropdownMenuLabel;
export const DropdownMenuPortal = ShadcnDropdownMenuPortal;
export const DropdownMenuRadioGroup = ShadcnDropdownMenuRadioGroup;
export const DropdownMenuRadioItem = ShadcnDropdownMenuRadioItem;
export const DropdownMenuSeparator = ShadcnDropdownMenuSeparator;
export const DropdownMenuShortcut = ShadcnDropdownMenuShortcut;
export const DropdownMenuSub = ShadcnDropdownMenuSub;
export const DropdownMenuSubContent = ShadcnDropdownMenuSubContent;
export const DropdownMenuSubTrigger = ShadcnDropdownMenuSubTrigger;
export const DropdownMenuTrigger = ShadcnDropdownMenuTrigger;
