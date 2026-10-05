export const ENROLLMENT = {
  success: {
    generateQr: "QR code généré.",
    generateCode: "Code généré.",
    downloadQr: "QR code téléchargé.",
    copyCode: "Code copié.",
    connect: "Appareil connecté.",
    disconnect: "Appareil déconnecté.",
    enroll: "Appareil enrôlé.",
    applyDeviceOwner: "Mode sans restriction appliqué.",
  },
  error: {
    generateQr: "Impossible de générer le QR code. Réessayez.",
    generateCode: "Impossible de générer le code. Réessayez.",
    downloadQr: "Impossible de télécharger le QR code. Réessayez.",
    printQr: "Impossible d’imprimer le QR code. Réessayez.",
    copyCode: "Impossible de copier le code. Réessayez.",
    connect: "Impossible de se connecter à l’appareil. Réessayez.",
    deviceBusy: "L’appareil est utilisé par un autre programme. Arrêtez ADB (« adb kill-server »), puis réessayez.",
    disconnect: "Impossible de déconnecter l’appareil. Réessayez.",
    install: "Impossible de télécharger et d’installer l’agent. Réessayez.",
    enroll: "Impossible d’enrôler l’appareil. Réessayez.",
    deviceOwner: "Impossible d’activer le mode Device Owner. Réessayez.",
    applyDeviceOwner: "Impossible d’appliquer le mode sans restriction. Réessayez.",
  },
  button: {
    reset: "Réinitialiser",
    generateQr: "Générer le QR code",
    regenerateQr: "Régénérer le QR code",
    generateCode: "Générer le code",
    regenerateCode: "Générer un nouveau code",
    downloadQr: "Télécharger",
    printQr: "Imprimer",
    copyCode: "Copier le code",
    connect: "Connecter un appareil",
    disconnect: "Déconnecter",
    enroll: "Enrôler",
    downloadAgent: "Télécharger l’agent",
    downloadApk: "Télécharger l’APK de l’agent",
    installWithCode: "Installer avec un code",
    installWithUsb: "Installer par USB",
    applyDeviceOwner: "Appliquer le mode sans restriction",
    confirmDeviceOwner: "Appliquer",
  },
  page: {
    title: "Enrôler un appareil",
    breadcrumb: "Enrôlement",
  },
  // L'ordre des clés est celui des onglets.
  methods: {
    label: "Méthode d’enrôlement",
    qr: {
      tab: "QR code",
      breadcrumb: "Nouveau QR code",
      subtitle: "Provisioning Device Owner par QR code, sans service Google.",
    },
    manual: {
      tab: "Manuel",
      breadcrumb: "Enrôlement manuel",
      subtitle: "Installation de l’agent à la main, sans réinitialisation préalable.",
    },
  },
  config: {
    title: "Configuration",
    description: {
      qr: "Ces réglages sont inscrits dans le QR code.",
      manual: "Ces réglages sont appliqués à l’appareil lors de l’enrôlement.",
    },
    optional: "facultatif",
    name: {
      label: "Nom de l’appareil",
      description: "Ce nom sera attribué à l’appareil une fois enrôlé.",
    },
    group: { label: "Groupe" },
    policy: { label: "Politique" },
    wifi: {
      label: "Réseau Wi-Fi",
      none: "Aucun · choisi sur l’appareil",
      description:
        "Réseaux enregistrés dans les paramètres. Sans réseau, l’appareil demandera d’en choisir un après le scan.",
    },
    apkUrl: {
      label: "URL de téléchargement de l’agent",
      placeholder: "https://mdm.entreprise.fr/agent/openmdm-agent.apk",
      description: "Vide : l’APK par défaut du serveur est utilisé, téléchargeable avec le bouton.",
    },
  },
  qr: {
    title: "QR code d’enrôlement",
    alt: "QR code d’enrôlement",
    empty: {
      title: "Aucun QR code généré",
      description: "Vérifiez la configuration, puis générez le QR code à scanner sur l’appareil.",
    },
    fileName: "qr-code-enrolement.svg",
    instructions: {
      title: "Sur l’appareil",
      steps: [
        "Réinitialisez l’appareil aux paramètres d’usine.",
        "Touchez 6 fois l’écran d’accueil pour ouvrir le lecteur.",
        "Scannez ce code et connectez-vous au Wi-Fi.",
      ],
    },
  },
  usb: {
    title: "Connexion USB",
    description: "Installe l’agent et active Device Owner depuis le navigateur, via WebUSB",
    browsers: "Chrome · Edge · Opera",
    idle: {
      title: "Aucun appareil connecté",
      description: "Branchez l’appareil puis autorisez ce poste sur l’écran du téléphone.",
    },
    prerequisites: {
      title: "Avant de connecter",
      items: [
        "Débogage USB activé dans les options pour les développeurs",
        "Câble USB de données (pas seulement de charge)",
        "Aucun compte Google ou autre sur l’appareil, pour Device Owner",
      ],
    },
    device: {
      serial: "N°",
      android: "Android",
      adbAuthorized: "ADB autorisé",
      connected: "Connecté",
      // Un appareil dont le descripteur USB n'a pas de nom de produit.
      unknownModel: "Appareil Android",
    },
    // WebUSB absent (Firefox, Safari, page non sécurisée) : on le dit, et on oriente vers l'installation avec un code.
    unsupported: {
      message: "Ce navigateur ne prend pas en charge WebUSB.",
      recommendation: "Installez plutôt l’agent avec un code.",
    },
    // L'ordre des clés est celui des étapes.
    steps: {
      install: { title: "Installer l’agent", description: "Télécharge l’APK via le serveur, puis l’installe par ADB" },
      enroll: { title: "Enrôler auprès du serveur", description: "Démarre l’agent avec le nom, le groupe et la politique" },
      deviceOwner: { title: "Activer le mode Device Owner", description: "dpm set-device-owner, exécuté par WebUSB" },
    },
    // Le badge de « Installer l'agent » dit où elle en est.
    installPhase: {
      download: "Téléchargement en cours",
      install: "Installation en cours",
    },
    stepStatus: {
      todo: "À faire",
      running: "En cours",
      done: "Terminé",
    },
    enrolled: {
      title: "Appareil enrôlé",
      description: "Premier check-in MQTT reçu. Vous pouvez débrancher le câble.",
    },
    chromiumOnly: {
      title: "Navigateurs basés sur Chromium uniquement",
      description:
        "Firefox et Safari ne prennent pas en charge WebUSB : utilisez l’installation avec un code. Si ADB tourne sur ce poste, arrêtez-le (« adb kill-server ») : il bloque l’accès à l’appareil.",
    },
  },
  noUsb: {
    title: "Installation avec code",
    description: "Installation depuis l’appareil, en mode restreint (sans Device Owner)",
    code: {
      label: "Code à saisir dans l’agent",
      expired: "Code expiré",
      empty: {
        title: "Aucun code généré",
        description: "Générez le code à 6 chiffres à saisir dans l’agent, sur l’appareil.",
      },
    },
    steps: {
      install: "Téléchargez l’agent sur l’appareil et installez l’APK (sources inconnues à autoriser).",
      enterCode: "Ouvrez l’agent, saisissez le code à 6 chiffres puis touchez « Enrôler ».",
    },
  },
  deviceOwnerDialog: {
    title: "Mode sans restriction",
    description: "Aussi appelé « Device Owner » côté Android, ce mode donne à l’agent un contrôle complet de l’appareil.",
    points: {
      policies:
        "Il permet d’appliquer les politiques de sécurité (verrouillage, chiffrement, restrictions d’usage) sans intervention de l’utilisateur.",
      wifi: "Il configure automatiquement le Wi-Fi et les comptes nécessaires à l’appareil.",
      wipe: "Il est nécessaire pour permettre l’effacement à distance en cas de perte ou de vol.",
    },
  },
  validation: {
    nameRequired: "Saisissez le nom de l’appareil.",
    nameTooLong: "Le nom de l’appareil ne peut pas dépasser 100 caractères.",
    groupRequired: "Choisissez un groupe.",
    policyRequired: "Choisissez une politique.",
    apkUrlInvalid: "Saisissez une URL valide, commençant par https:// ou http://.",
  },
} as const;
