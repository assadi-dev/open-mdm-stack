"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/sidebar/Sidebar";
import { NAVIGATION } from "@/constants/navigation";
import type { NavigationItem } from "@/types/navigation";
import { useFetchShellStatus } from "../_hooks/useFetchShellStatus";

type SidebarNavGroupProps = {
  label: string;
  items: NavigationItem[];
};

export const SidebarNavGroup = ({ label, items }: SidebarNavGroupProps) => {
  const pathname = usePathname();
  const { data } = useFetchShellStatus();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const alertCount = item.badge === "alerts" ? (data?.alertCount ?? 0) : 0;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  disabled={!item.enabled}
                  aria-current={isActive ? "page" : undefined}
                  render={item.enabled ? <Link href={item.href} /> : undefined}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {alertCount > 0 && (
                  <SidebarMenuBadge aria-label={`${alertCount} ${NAVIGATION.alertsLabel}`}>{alertCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
