import type { ComponentProps } from "react";
import {
  Tabs as ShadcnTabs,
  TabsContent as ShadcnTabsContent,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Tabs = ShadcnTabs;
export const TabsContent = ShadcnTabsContent;

export const TabsList = ({ className, ...props }: ComponentProps<typeof ShadcnTabsList>) => (
  <ShadcnTabsList className={cn("group-data-horizontal/tabs:h-11", className)} {...props} />
);

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof ShadcnTabsTrigger>) => (
  <ShadcnTabsTrigger
    className={cn(
      "h-full cursor-pointer px-4 text-foreground data-active:bg-tab-active data-active:text-tab-active-foreground data-active:hover:text-tab-active-foreground data-active:font-semibold group-data-[variant=default]/tabs-list:data-active:shadow-none",
      className,
    )}
    {...props}
  />
);
