import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/alerts/Alert";
import { WIFI_NETWORK } from "@/constants/wifi-network";

// Simple information affichée en permanence, pas une alerte : `role="note"` évite l'annonce vocale immédiate de `role="alert"`.
export const WifiNetworksNotice = () => (
  <Alert variant="info" role="note">
    <Info aria-hidden="true" />
    <AlertTitle>{WIFI_NETWORK.notice.title}</AlertTitle>
    <AlertDescription className="text-[0.8125rem] leading-4.5">{WIFI_NETWORK.notice.description}</AlertDescription>
  </Alert>
);
