const COLLECTION = ["devices", "collection"] as const;

export const DEVICES = {
  // Préfixe des pages du tableau et du résumé : l'invalider après une mutation les recharge toutes.
  collection: COLLECTION,
  collectionPage: (query: string) => [...COLLECTION, "page", query] as const,
  summary: [...COLLECTION, "summary"] as const,
} as const;
