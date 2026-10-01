import type { SortingState } from "@tanstack/react-table";
import { createParser } from "nuqs";

// Même format que l'API : `sort=-createdAt,ssid`, le `-` marque le tri décroissant.
const SORT_SEPARATOR = ",";
const DESC_PREFIX = "-";

export const serializeSorting = (sorting: SortingState) =>
  sorting.map(({ id, desc }) => (desc ? `${DESC_PREFIX}${id}` : id)).join(SORT_SEPARATOR);

const parseSorting = (value: string): SortingState | null => {
  const sorting = value
    .split(SORT_SEPARATOR)
    .filter(Boolean)
    .map((token) =>
      token.startsWith(DESC_PREFIX) ? { id: token.slice(DESC_PREFIX.length), desc: true } : { id: token, desc: false },
    );

  return sorting.length > 0 ? sorting : null;
};

export const parseAsSorting = createParser({
  parse: parseSorting,
  serialize: serializeSorting,
  // Un tableau n'est jamais égal à un autre par référence : sans `eq`, le tri par défaut s'écrirait dans l'URL.
  eq: (a, b) => serializeSorting(a) === serializeSorting(b),
});
