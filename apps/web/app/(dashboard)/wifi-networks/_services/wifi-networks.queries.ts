const COLLECTION = ["wifi-networks", "collection"] as const;

export const WIFI_NETWORKS = {
  // Préfixe des pages du tableau et du total : l'invalider après une mutation les recharge toutes.
  collection: COLLECTION,
  collectionPage: (query: string) => [...COLLECTION, "page", query] as const,
  count: [...COLLECTION, "count"] as const,
} as const;
