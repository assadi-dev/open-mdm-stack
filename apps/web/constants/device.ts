export const DEVICE = {
  battery: {
    label: "Batterie",
    unknown: "—",
  },
  table: {
    device: "Appareil",
    model: "Modèle",
    user: "Utilisateur",
    // Plus affiché sur la page Appareils (aucun groupe côté API) ; la carte « Appareils récents » du tableau de bord l'utilise encore.
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
  // Ni nom ni modèle côté API : l'appareil reste listé.
  unknownDevice: "Appareil inconnu",
  // La colonne « Modèle » : le modèle est facultatif côté API.
  noModel: "—",
  // Aucun porteur n'est associé à l'appareil.
  unassigned: "—",
  lastContact: {
    // Un appareil connecté est joignable à l'instant même, quelle que soit la date de son dernier heartbeat.
    now: "À l'instant",
    // Ni heartbeat ni connexion : l'appareil n'a jamais été vu.
    never: "—",
  },
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
    pending: "En attente",
  },
  filters: {
    tabsLabel: "Filtrer les appareils par statut",
    search: {
      placeholder: "N° de série, modèle, utilisateur…",
      label: "Rechercher un appareil",
    },
    android: { label: "Version Android", all: "Android : toutes", version: "Android" },
  },
  results: { one: "résultat", many: "résultats" },
  pagination: { items: "appareils" },
} as const;
