export const DEVICE = {
  success: {
    update: "Appareil mis à jour.",
    refresh: "Appareil actualisé.",
    delete: "Appareil supprimé.",
    deleteMany: "Appareils supprimés.",
    block: "Appareil bloqué.",
    blockMany: "Appareils bloqués.",
    unblock: "Appareil débloqué.",
    unblockMany: "Appareils débloqués.",
  },
  error: {
    update: "Impossible de mettre à jour l'appareil. Réessayez.",
    refresh: "Impossible d'actualiser l'appareil. Réessayez.",
    // Deux situations que l'administrateur règle différemment : l'API répond 409 (hors ligne) ou 504 (aucune réponse).
    refreshOffline: "L'appareil est hors ligne.",
    refreshTimeout: "L'appareil n'a pas répondu.",
    // L'API répond 403 : un appareil bloqué ne peut plus joindre le serveur, il ne peut donc pas se synchroniser.
    refreshBlocked: "L'appareil est bloqué.",
    refreshMany: "Impossible d'actualiser les appareils. Réessayez.",
    delete: "Impossible de supprimer l'appareil. Réessayez.",
    deleteMany: "Impossible de supprimer les appareils. Réessayez.",
    block: "Impossible de bloquer l'appareil. Réessayez.",
    blockMany: "Impossible de bloquer les appareils. Réessayez.",
    unblock: "Impossible de débloquer l'appareil. Réessayez.",
    unblockMany: "Impossible de débloquer les appareils. Réessayez.",
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
      partial: "{done} sur {total} appareils synchronisés. Les autres sont hors ligne, bloqués ou n'ont pas répondu.",
      none: "Aucun des {total} appareils n'a pu être actualisé : ils sont hors ligne, bloqués ou n'ont pas répondu.",
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
    block: "Bloquer",
    blockMany: "Bloquer",
    unblock: "Débloquer",
    unblockMany: "Débloquer",
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
    blocked: { label: "Afficher uniquement les appareils bloqués" },
  },
  pagination: { items: "appareils" },
  dialog: {
    update: {
      title: "Modifier l'appareil",
      description: "Donnez un nom à cet appareil pour le retrouver plus facilement dans la liste.",
      submit: "Enregistrer",
      submitting: "Enregistrement…",
    },
    // « Supprimer » efface l'appareil et ses données (télémétrie, commandes) ; un réenrôlement crée un nouvel appareil.
    delete: {
      title: "Supprimer l'appareil",
      description:
        "Cet appareil et toutes ses données seront supprimés définitivement. Il ne pourra plus joindre le serveur tant qu'il ne s'est pas réenrôlé.",
      submit: "Supprimer",
    },
    deleteMany: {
      title: "Supprimer",
      items: "appareils",
      description:
        "Ces appareils et toutes leurs données seront supprimés définitivement. Ils ne pourront plus joindre le serveur tant qu'ils ne se seront pas réenrôlés.",
      submit: "Supprimer",
    },
    // « Bloquer » garde l'appareil dans la liste, mais le serveur refuse ses requêtes.
    block: {
      title: "Bloquer l'appareil",
      description:
        "Cet appareil restera dans la liste, mais le serveur refusera toutes ses requêtes : il ne pourra plus se synchroniser.",
      submit: "Bloquer",
    },
    blockMany: {
      title: "Bloquer",
      items: "appareils",
      description:
        "Ces appareils resteront dans la liste, mais le serveur refusera toutes leurs requêtes : ils ne pourront plus se synchroniser.",
      submit: "Bloquer",
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
