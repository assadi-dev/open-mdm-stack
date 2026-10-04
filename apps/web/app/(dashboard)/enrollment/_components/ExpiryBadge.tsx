"use client";

import { CircleAlert, Hourglass } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { ENROLLMENT } from "@/constants/enrollment";
import { useNow } from "../_hooks/useNow";
import { isExpired, toRemainingLabel } from "../_services/enrollment.utils";

type ExpiryBadgeProps = {
  expiresAt: string;
};

// Le temps restant avant qu'un QR code ou un code ne soit plus accepté, mis à jour chaque minute.
export const ExpiryBadge = ({ expiresAt }: ExpiryBadgeProps) => {
  const now = useNow();

  if (isExpired(expiresAt, now)) {
    return (
      <Badge variant="danger">
        <CircleAlert aria-hidden="true" />
        {ENROLLMENT.expiry.expired}
      </Badge>
    );
  }

  return (
    <Badge variant="warning">
      <Hourglass aria-hidden="true" />
      {toRemainingLabel(expiresAt, now)}
    </Badge>
  );
};
