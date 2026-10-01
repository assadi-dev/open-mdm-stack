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



export const ERROR_HTTP_API_MESSAGES = {
  400: "La requête envoyée est invalide. Veuillez vérifier les données envoyées.",
  401: "Vous n'avez pas les permissions pour effectuer cette action.",
  403: "Vous n'avez pas les autorisations nécessaires pour accéder à cette ressource.",
  404: "La ressource demandée est introuvable.",
  500: "Une erreur est survenue. Veuillez réessayer plus tard.",
} as const;
