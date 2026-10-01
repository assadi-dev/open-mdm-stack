import { WIFI_NETWORK } from "@/constants/wifi-network";

const DOT_COUNT = 8;
const DOT_KEYS = Array.from({ length: DOT_COUNT }, (_, index) => index);

// L'API n'expose jamais le mot de passe d'un réseau : la colonne affiche toujours le même masque.
export const WifiPasswordMask = () => (
  <span role="img" aria-label={WIFI_NETWORK.passwordMasked} className="flex items-center gap-1">
    {DOT_KEYS.map((key) => (
      <span key={key} aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
    ))}
  </span>
);
