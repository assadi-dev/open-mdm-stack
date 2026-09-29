import type { ShellStatus } from "../_types/shell.types";

// Données fictives : aucun endpoint de `apps/api` n'expose encore ces compteurs.
export const SHELL_STATUS_MOCK: ShellStatus = {
  alertCount: 3,
  unreadNotificationCount: 3,
  broker: {
    isOnline: true,
    connectedDeviceCount: 1106,
  },
};
