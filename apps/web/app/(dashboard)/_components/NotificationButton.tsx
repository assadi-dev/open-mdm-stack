"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { HEADER } from "@/constants/header";
import { useFetchShellStatus } from "../_hooks/useFetchShellStatus";

export const NotificationButton = () => {
  const { data } = useFetchShellStatus();
  const unreadCount = data?.unreadNotificationCount ?? 0;
  const label =
    unreadCount > 0
      ? `${HEADER.notifications.label}, ${unreadCount} ${HEADER.notifications.unread}`
      : HEADER.notifications.label;

  return (
    <Button variant="secondary" size="icon" aria-label={label} className="relative">
      <Bell />
      {unreadCount > 0 && (
        <span aria-hidden="true" className="absolute top-2.25 right-2.5 size-2 rounded-full bg-danger ring-2 ring-popover" />
      )}
    </Button>
  );
};
