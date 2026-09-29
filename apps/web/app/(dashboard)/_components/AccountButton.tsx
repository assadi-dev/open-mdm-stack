"use client";

import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/avatars/Avatar";
import { Button } from "@/components/buttons/Button";
import { HEADER } from "@/constants/header";
import { authClient } from "@/lib/auth/auth-client";
import { formatInitials } from "@/lib/format";

export const AccountButton = () => {
  const { data } = authClient.useSession();
  const name = data?.user.name ?? "";
  const label = name ? `${HEADER.account.label} ${name}, ${HEADER.account.role}` : HEADER.account.role;

  return (
    <Button variant="secondary" aria-label={label} className="h-12 gap-2.5 rounded-full pr-3.5 pl-1.5">
      <Avatar className="size-9">
        <AvatarFallback>{formatInitials(name)}</AvatarFallback>
      </Avatar>
      <span className="hidden flex-col items-start xl:flex">
        <span className="text-sm leading-5 font-medium">{name}</span>
        <span className="text-xs leading-4.5 font-normal text-muted-foreground">{HEADER.account.role}</span>
      </span>
      <ChevronDown />
    </Button>
  );
};
