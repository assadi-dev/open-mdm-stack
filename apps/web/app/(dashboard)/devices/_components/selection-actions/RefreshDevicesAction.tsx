import { RefreshCw } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";

// Le bouton seul : l'actualisation des appareils cochés n'est pas encore branchée. Après le clic, la barre se ferme
// et la sélection est vidée (comportement par défaut d'un `ActionBarItem`).
export const RefreshDevicesAction = () => (
  <ActionBarItem>
    <RefreshCw />
    {DEVICE.button.refreshMany}
  </ActionBarItem>
);
