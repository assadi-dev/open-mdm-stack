"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/sidebar/Sidebar";
import { NAVIGATION } from "@/constants/navigation";
import { BrokerStatusItem } from "./BrokerStatusItem";
import { SidebarLogoutButton } from "./SidebarLogoutButton";
import { SidebarNavGroup } from "./SidebarNavGroup";

export const AppSidebar = () => (
  <Sidebar>
    <SidebarHeader>
      <div className="px-1.5 py-0.5 text-[1.375rem] leading-7 font-semibold tracking-[-0.4px]">{NAVIGATION.brand}</div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarNavGroup label={NAVIGATION.group.main} items={NAVIGATION.main} />
      <SidebarNavGroup label={NAVIGATION.group.admin} items={NAVIGATION.admin} />
    </SidebarContent>
    <SidebarFooter>
      <BrokerStatusItem />
      <SidebarLogoutButton />
    </SidebarFooter>
  </Sidebar>
);
