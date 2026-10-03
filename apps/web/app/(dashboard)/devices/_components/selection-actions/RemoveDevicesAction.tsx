import { Trash2 } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";

// Le bouton seul : la suppression des appareils cochés n'est pas encore branchée. Quand elle le sera, la confirmation
// appellera `event.preventDefault()` dans `onSelect` pour garder la barre et la sélection pendant la question.
export const RemoveDevicesAction = () => (
  <ActionBarItem variant="destructive">
    <Trash2 />
    {DEVICE.button.deleteMany}
  </ActionBarItem>
);
