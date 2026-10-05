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
  // Le hint (« cette semaine », « vs hier ») ira avec les variations, quand l'API les fournira.
  kpi: {
    enrolled: { label: "Appareils enrôlés" /* , hint: "cette semaine" */ },
    online: { label: "En ligne" /* , hint: "vs hier" */ },
    offline: { label: "Hors ligne" /* , hint: "depuis hier" */ },
    commandRunning: { label: "Commande en cours" /* , hint: "vs hier" */ },
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
