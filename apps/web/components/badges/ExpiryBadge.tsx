"use client";

import { CircleAlert, Hourglass } from "lucide-react";
import { EXPIRY } from "@/constants/expiry";
import { useCountdown } from "@/hooks/useCountdown";
import { Badge } from "./Badge";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

// « 1 h 05 min », « 4 min 09 s », « 42 s » : arrondi à la seconde supérieure, « 0 s » n'est jamais affiché.
const formatRemaining = (remaining: number) => {
  const total = Math.ceil(remaining / 1000);
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  if (minutes > 0) return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
  return `${seconds} s`;
};

type ExpiryBadgeProps = {
  // Date ISO de l'expiration.
  expiresAt: string;
  // Ce qui s'affiche une fois expiré (« Code expiré »…), « Expiré » par défaut.
  expiredLabel?: string;
};

// Le compte à rebours avant expiration, mis à jour chaque seconde, puis le libellé d'expiration.
export const ExpiryBadge = ({ expiresAt, expiredLabel = EXPIRY.expired }: ExpiryBadgeProps) => {
  const remaining = useCountdown(expiresAt);

  if (remaining === 0) {
    return (
      <Badge variant="danger">
        <CircleAlert aria-hidden="true" />
        {expiredLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="tabular-nums">
      <Hourglass aria-hidden="true" />
      {EXPIRY.in} {formatRemaining(remaining)}
    </Badge>
  );
};
