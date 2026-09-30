export const DEVICE = {
  battery: {
    label: "Batterie",
    unknown: "—",
  },
  table: {
    device: "Appareil",
    user: "Utilisateur",
    group: "Groupe",
    status: "Statut",
    battery: "Batterie",
    lastContact: "Dernier contact",
    actions: "Actions",
  },
  button: {
    create: "Enrôler un appareil",
    filter: "Filtrer",
    viewDetail: "Voir le détail",
  },
  actionsFor: "Actions pour",
  serialPrefix: "N°",
  page: {
    title: "Appareils",
    subtitle: {
      enrolled: { one: "appareil enrôlé", many: "appareils enrôlés" },
      online: "en ligne",
    },
  },
  // L'ordre des clés est celui des onglets.
  tabs: {
    all: "Tous",
    online: "En ligne",
    offline: "Hors ligne",
    nonCompliant: "Non conformes",
    pending: "En attente",
  },
  filters: {
    tabsLabel: "Filtrer les appareils par statut",
    search: {
      placeholder: "N° de série, modèle, utilisateur…",
      label: "Rechercher un appareil",
    },
    group: { label: "Groupe", all: "Groupe : tous" },
    android: { label: "Version Android", all: "Android : toutes", version: "Android" },
  },
  results: { one: "résultat", many: "résultats" },
  pagination: { items: "appareils" },
} as const;
