import { useEffect, useState } from "react";

const MINUTE = 60_000;

// L'heure courante, relue à intervalle régulier : le temps restant avant expiration se met à jour sans recharger.
export const useNow = (interval = MINUTE) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);

  return now;
};
