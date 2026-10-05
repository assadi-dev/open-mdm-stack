export const DEVICE = {
  success: {
    update: "Appareil mis à jour.",
    refresh: "Appareil actualisé.",
    delete: "Appareil supprimé.",
    deleteMany: "Appareils supprimés.",
  },
  error: {
    update: "Impossible de mettre à jour l'appareil. Réessayez.",
    refresh: "Impossible d'actualiser l'appareil. Réessayez.",
    // Deux situations que l'administrateur règle différemment : l'API répond 409 (hors ligne) ou 504 (aucune réponse).
    refreshOffline: "L'appareil est hors ligne.",
    refreshTimeout: "L'appareil n'a pas répondu.",
    refreshMany: "Impossible d'actualiser les appareils. Réessayez.",
    delete: "Impossible de supprimer l'appareil. Réessayez.",
    deleteMany: "Impossible de supprimer les appareils. Réessayez.",
  },
  // L'actualisation attend les appareils (15 s au plus) : un toast de promesse la suit, de l'envoi au résultat, pour un
  // appareil comme pour plusieurs (un seul toast pour toute la sélection). `{count}`, `{done}` et `{total}` sont
  // remplacés par des nombres (voir `devices.utils.ts`).
  toast: {
    refresh: {
      loading: "Synchronisation en cours",
    },
    refreshMany: {
      loading: "Synchronisation de {count} appareils en cours",
      all: "{count} appareils synchronisés.",
      partial: "{done} sur {total} appareils synchronisés. Les autres sont hors ligne ou n'ont pas répondu.",
      none: "Aucun des {total} appareils n'a pu être actualisé : ils sont hors ligne ou n'ont pas répondu.",
    },
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
    refresh: "Synchroniser",
    refreshMany: "Synchroniser",
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
    // Le panneau « Filtrer » : choisir « Afficher tout » vide le champ (tout revient à ne pas filtrer).
    showAll: "Afficher tout",
    brand: { label: "Marque", placeholder: "Toutes les marques" },
    model: { label: "Modèle", placeholder: "Tous les modèles" },
    // Aucun groupe côté API : le champ est grisé en attendant.
    group: { label: "Groupe", soon: "(bientôt)", placeholder: "Tous les groupes" },
    android: { label: "Version Android", placeholder: "Toutes les versions", version: "Android" },
  },
  pagination: { items: "appareils" },
  dialog: {
    update: {
      title: "Modifier l'appareil",
      description: "Donnez un nom à cet appareil pour le retrouver plus facilement dans la liste.",
      submit: "Enregistrer",
      submitting: "Enregistrement…",
    },
    // « Supprimer » désenrôle : l'appareil quitte la liste, le serveur le refuse, et un réenrôlement le ramène.
    delete: {
      title: "Supprimer l'appareil",
      description:
        "Cet appareil sera désenrôlé : il disparaîtra de la liste et ne pourra plus joindre le serveur tant qu'il ne s'est pas réenrôlé.",
      submit: "Supprimer",
    },
    deleteMany: {
      title: "Supprimer",
      items: "appareils",
      description:
        "Ces appareils seront désenrôlés : ils disparaîtront de la liste et ne pourront plus joindre le serveur tant qu'ils ne se seront pas réenrôlés.",
      submit: "Supprimer",
    },
  },
  form: {
    name: {
      label: "Nom de l'appareil",
      optional: "(optionnel)",
      description: "Laissez vide pour afficher le modèle.",
      placeholder: "ex. Tablette entrepôt 3",
    },
  },
  validation: {
    nameTooLong: "Le nom ne peut pas dépasser 100 caractères.",
  },
} as const;
