"use client";

import { LogOut } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/sidebar/Sidebar";
import { ACTION_LABELS } from "@/constants/actions";
import { useSignOut } from "../_hooks/useSignOut";

export const SidebarLogoutButton = () => {
  const { signOut, isPending } = useSignOut();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={signOut} disabled={isPending} className="text-danger-text hover:text-danger-text">
          <LogOut />
          <span>{ACTION_LABELS.logout}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
