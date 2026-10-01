import { useEffect, useState } from "react";

// Renvoie `value` une fois qu'elle n'a plus changé pendant `delay` ms (ex. la recherche, pour ne pas lancer une requête par frappe).
export const useDebouncedValue = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};
