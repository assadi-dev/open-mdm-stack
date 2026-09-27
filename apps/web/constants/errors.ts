export const ERROR_MESSAGES = {
  generic: "Une erreur est survenue. Réessayez.",
  network: "Impossible de contacter le serveur. Vérifiez votre connexion.",
  rateLimit: "Trop de tentatives, veuillez réessayer plus tard.",


} as const;


export const ERROR_FORM_MESSAGES = {
  email: "Veuillez saisir une adresse e-mail valide.",
  password: "Le mot de passe doit contenir au moins 8 caractères.",
} as const;

export const ERROR_AUTH_MESSAGES = {
  invalidCredentials: "Les identifiants saisis sont incorrects. Veuillez vérifier votre email ou mot de passe.",
} as const;
