export const WIFI_NETWORK = {
  success: {
    create: "Réseau Wi-Fi ajouté.",
    update: "Réseau Wi-Fi mis à jour.",
    delete: "Réseau Wi-Fi supprimé.",
    deleteMany: "Réseaux Wi-Fi supprimés.",
  },
  error: {
    create: "Impossible d'ajouter le réseau Wi-Fi. Réessayez.",
    update: "Impossible de mettre à jour le réseau Wi-Fi. Réessayez.",
    delete: "Impossible de supprimer le réseau Wi-Fi. Réessayez.",
    deleteMany: "Impossible de supprimer les réseaux Wi-Fi. Réessayez.",
  },
  button: {
    create: "Ajouter une connexion wifi",
    update: "Modifier",
    delete: "Supprimer",
    deleteMany: "Supprimer",
    filter: "Filtrer",
  },
  page: {
    title: "Réseaux Wi-Fi",
    section: "Réseaux enregistrés",
    subtitle: {
      registered: { one: "réseau enregistré", many: "réseaux enregistrés" },
    },
  },
  notice: {
    title: "Distribution automatique",
    description:
      "Ces réseaux sont proposés lors de l’enrôlement et poussés aux appareils déjà enrôlés via leur politique.",
  },
  table: {
    network: "Réseau",
    security: "Sécurité",
    password: "Mot de passe",
    createdAt: "Créé le",
    actions: "Actions",
  },
  passwordMasked: "Mot de passe masqué",
  actionsFor: "Actions pour",
  // L'ordre des clés est celui de la liste déroulante du formulaire.
  security: {
    NONE: "Aucune",
    WEP: "WEP",
    WPA: "WPA",
    WPA2: "WPA2",
    WPA3: "WPA3",
  },
  filters: {
    search: {
      placeholder: "Rechercher un réseau",
      label: "Rechercher un réseau",
    },
  },
  results: { one: "résultat", many: "résultats" },
  pagination: { items: "réseaux" },
  form: {
    name: { label: "Nom", optional: "(optionnel)", description: "Nom personnalisé du réseau" },
    ssid: { label: "Nom du réseau (SSID)", placeholder: "ex. Terrain-Lyon" },
    security: { label: "Type de sécurité" },
    password: {
      label: "Mot de passe",
      placeholder: "8 caractères minimum",
      keepPlaceholder: "Laisser vide pour conserver le mot de passe actuel",
    },
  },
  validation: {
    ssidRequired: "Saisissez le nom du réseau.",
    ssidTooLong: "Le nom du réseau ne peut pas dépasser 32 caractères.",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    passwordTooLong: "Le mot de passe ne peut pas dépasser 63 caractères.",
  },
  dialog: {
    create: {
      title: "Ajouter une connexion wifi",
      description: "Ce réseau sera proposé lors de l’enrôlement et poussé aux appareils déjà enrôlés.",
      submit: "Ajouter le réseau",
      submitting: "Ajout en cours…",
    },
    update: {
      title: "Modifier la connexion wifi",
      description: "Les modifications seront poussées aux appareils déjà enrôlés.",
      submit: "Enregistrer",
      submitting: "Enregistrement…",
    },
    delete: {
      title: "Supprimer le réseau",
      description:
        "Ce réseau ne sera plus proposé lors de l’enrôlement ni poussé aux appareils enrôlés. Cette action est irréversible.",
      submit: "Supprimer",
    },
    deleteMany: {
      title: "Supprimer",
      items: "réseaux",
      description:
        "Ces réseaux ne seront plus proposés lors de l’enrôlement ni poussés aux appareils enrôlés. Cette action est irréversible.",
      submit: "Supprimer",
    },
  },
} as const;
