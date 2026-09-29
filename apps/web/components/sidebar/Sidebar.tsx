import type { ComponentProps, CSSProperties } from "react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter as ShadcnSidebarFooter,
  SidebarGroup as ShadcnSidebarGroup,
  SidebarGroupAction as ShadcnSidebarGroupAction,
  SidebarGroupContent as ShadcnSidebarGroupContent,
  SidebarGroupLabel as ShadcnSidebarGroupLabel,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarInput as ShadcnSidebarInput,
  SidebarInset as ShadcnSidebarInset,
  SidebarMenu as ShadcnSidebarMenu,
  SidebarMenuAction as ShadcnSidebarMenuAction,
  SidebarMenuBadge as ShadcnSidebarMenuBadge,
  SidebarMenuButton as ShadcnSidebarMenuButton,
  SidebarMenuItem as ShadcnSidebarMenuItem,
  SidebarMenuSkeleton as ShadcnSidebarMenuSkeleton,
  SidebarMenuSub as ShadcnSidebarMenuSub,
  SidebarMenuSubButton as ShadcnSidebarMenuSubButton,
  SidebarMenuSubItem as ShadcnSidebarMenuSubItem,
  SidebarProvider as ShadcnSidebarProvider,
  SidebarRail as ShadcnSidebarRail,
  SidebarSeparator as ShadcnSidebarSeparator,
  SidebarTrigger as ShadcnSidebarTrigger,
  useSidebar as useShadcnSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// 280px de carte + 24px de marge gauche (`p-6 pr-0` sur Sidebar), mesurés en border-box. En px : la racine est à 95 % (voir globals.css).
const SIDEBAR_WIDTH = "304px";

export const SidebarProvider = ({ style, ...props }: ComponentProps<typeof ShadcnSidebarProvider>) => (
  <ShadcnSidebarProvider style={{ "--sidebar-width": SIDEBAR_WIDTH, ...style } as CSSProperties} {...props} />
);

export const Sidebar = ({ variant = "floating", className, ...props }: ComponentProps<typeof ShadcnSidebar>) => (
  <ShadcnSidebar
    variant={variant}
    className={cn(
      "p-6 pr-0 *:data-[slot=sidebar-inner]:rounded-2xl! *:data-[slot=sidebar-inner]:p-3 *:data-[slot=sidebar-inner]:shadow-none!",
      className,
    )}
    {...props}
  />
);

export const SidebarInset = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarInset>) => (
  <ShadcnSidebarInset className={cn("min-w-0 gap-5 bg-transparent p-6", className)} {...props} />
);

export const SidebarContent = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarContent>) => (
  <ShadcnSidebarContent className={cn("gap-2", className)} {...props} />
);

export const SidebarGroup = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarGroup>) => (
  <ShadcnSidebarGroup className={cn("in-data-[slot=sidebar-inner]:px-0", className)} {...props} />
);

export const SidebarGroupLabel = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarGroupLabel>) => (
  <ShadcnSidebarGroupLabel className={cn("px-3.5 text-[0.8125rem] text-muted-foreground", className)} {...props} />
);

export const SidebarMenu = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarMenu>) => (
  <ShadcnSidebarMenu className={cn("gap-1", className)} {...props} />
);

export const SidebarMenuButton = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarMenuButton>) => (
  <ShadcnSidebarMenuButton
    className={cn(
      "h-11 gap-3 rounded-md px-3.5 text-[0.9375rem] font-medium [&_svg]:size-5 data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground",
      className,
    )}
    {...props}
  />
);

export const SidebarMenuBadge = ({ className, ...props }: ComponentProps<typeof ShadcnSidebarMenuBadge>) => (
  <ShadcnSidebarMenuBadge
    className={cn(
      "right-3.5 rounded-full bg-danger text-[0.6875rem] font-semibold text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white peer-data-[size=default]/menu-button:top-3",
      className,
    )}
    {...props}
  />
);

export const SidebarFooter = ShadcnSidebarFooter;
export const SidebarGroupAction = ShadcnSidebarGroupAction;
export const SidebarGroupContent = ShadcnSidebarGroupContent;
export const SidebarHeader = ShadcnSidebarHeader;
export const SidebarInput = ShadcnSidebarInput;
export const SidebarMenuAction = ShadcnSidebarMenuAction;
export const SidebarMenuItem = ShadcnSidebarMenuItem;
export const SidebarMenuSkeleton = ShadcnSidebarMenuSkeleton;
export const SidebarMenuSub = ShadcnSidebarMenuSub;
export const SidebarMenuSubButton = ShadcnSidebarMenuSubButton;
export const SidebarMenuSubItem = ShadcnSidebarMenuSubItem;
export const SidebarRail = ShadcnSidebarRail;
export const SidebarSeparator = ShadcnSidebarSeparator;
export const SidebarTrigger = ShadcnSidebarTrigger;
export const useSidebar = useShadcnSidebar;
