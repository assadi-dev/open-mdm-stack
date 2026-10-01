export const DASHBOARD = {
  page: {
    title: "Tableau de bord",
    greeting: "Bonjour",
  },
  attention: {
    none: "Aucun appareil ne demande votre attention aujourd’hui.",
    one: "appareil demande votre attention aujourd’hui.",
    many: "appareils demandent votre attention aujourd’hui.",
  },
  kpi: {
    enrolled: { label: "Appareils enrôlés", hint: "cette semaine" },
    online: { label: "En ligne", hint: "vs hier" },
    nonCompliant: { label: "Non conformes", hint: "depuis hier" },
    pendingCommands: { label: "Commandes en attente", hint: "vs hier" },
  },
  flow: {
    title: "Commandes exécutées",
    chartLabel: "Commandes exécutées par mois",
    commands: "commandes",
    versus: "vs",
    total: "au total",
  },
  compliance: {
    title: "Conformité",
    description: "Toutes politiques · 7 derniers jours",
    chartLabel: "Conformité du parc",
    compliantDevices: "appareils conformes",
  },
  android: {
    title: "Versions Android",
    description: "Répartition du parc",
    chartLabel: "Versions Android",
    caption: "appareils",
  },
  recent: {
    title: "Appareils récemment actifs",
    description: "Derniers check-ins MQTT",
  },
  button: {
    filter: "Filtrer",
    openReport: "Ouvrir le rapport",
  },
} as const;
