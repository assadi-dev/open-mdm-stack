export const DEVICE = {
  success: {
    update: "Appareil mis à jour.",
  },
  error: {
    update: "Impossible de mettre à jour l'appareil. Réessayez.",
    // Le seul échec que l'administrateur peut corriger : un autre appareil porte déjà cet Android ID.
    updateConflict: "Cet Android ID est déjà utilisé par un autre appareil.",
  },
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
    refresh: "Actualiser",
    refreshMany: "Actualiser",
    update: "Modifier",
    delete: "Supprimer",
    deleteMany: "Supprimer",
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
  dialog: {
    update: {
      title: "Modifier l'appareil",
      description: "La version d'Android et la version du SDK sont remontées par l'appareil : sa prochaine connexion peut les réécrire.",
      submit: "Enregistrer",
      submitting: "Enregistrement…",
    },
  },
  form: {
    name: {
      label: "Nom de l'appareil",
      optional: "(optionnel)",
      description: "Laissez vide pour afficher le modèle.",
      placeholder: "ex. Tablette entrepôt 3",
    },
    androidVersion: { label: "Version d'Android", placeholder: "ex. 14" },
    sdkVersion: { label: "Version du SDK", placeholder: "ex. 34" },
    androidId: {
      label: "Android ID",
      placeholder: "ex. 934739b4e33ada2c",
      description: "L'appareil se reconnaît à cet identifiant quand il se réenrôle : ne le modifiez qu'en cas d'erreur.",
    },
  },
  validation: {
    nameTooLong: "Le nom ne peut pas dépasser 100 caractères.",
    androidVersionTooLong: "La version d'Android ne peut pas dépasser 32 caractères.",
    sdkVersionInvalid: "La version du SDK est un nombre entier entre 1 et 99.",
    androidIdTooLong: "L'Android ID ne peut pas dépasser 64 caractères.",
  },
} as const;
