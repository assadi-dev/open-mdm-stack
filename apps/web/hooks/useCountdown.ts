import { useEffect, useState } from "react";

const SECOND = 1000;

const toTime = (date: string) => new Date(date).getTime();

// Le temps restant avant `expiresAt`, en millisecondes : relu chaque seconde, puis figé à 0. Le minuteur s'arrête à
// l'expiration et repart si `expiresAt` change (un nouveau code, par exemple).
export const useCountdown = (expiresAt: string) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const end = toTime(expiresAt);
    if (Date.now() >= end) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= end) clearInterval(timer);
    }, SECOND);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return Math.max(toTime(expiresAt) - now, 0);
};
