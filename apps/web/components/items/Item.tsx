import type { ComponentProps } from "react";
import {
  Item as ShadcnItem,
  ItemActions as ShadcnItemActions,
  ItemContent as ShadcnItemContent,
  ItemDescription as ShadcnItemDescription,
  ItemFooter as ShadcnItemFooter,
  ItemGroup as ShadcnItemGroup,
  ItemHeader as ShadcnItemHeader,
  ItemMedia as ShadcnItemMedia,
  ItemSeparator as ShadcnItemSeparator,
  ItemTitle as ShadcnItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

export const ItemMedia = ({ variant, className, ...props }: ComponentProps<typeof ShadcnItemMedia>) => (
  <ShadcnItemMedia
    variant={variant}
    className={cn(variant === "icon" && "size-8 rounded-sm border border-card-border bg-muted", className)}
    {...props}
  />
);

export const ItemDescription = ({ className, ...props }: ComponentProps<typeof ShadcnItemDescription>) => (
  <ShadcnItemDescription className={cn("text-[13px] leading-4.5", className)} {...props} />
);

export const Item = ShadcnItem;
export const ItemActions = ShadcnItemActions;
export const ItemContent = ShadcnItemContent;
export const ItemFooter = ShadcnItemFooter;
export const ItemGroup = ShadcnItemGroup;
export const ItemHeader = ShadcnItemHeader;
export const ItemSeparator = ShadcnItemSeparator;
export const ItemTitle = ShadcnItemTitle;
