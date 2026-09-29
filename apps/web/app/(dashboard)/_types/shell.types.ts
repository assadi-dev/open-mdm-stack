export type ShellStatus = {
  alertCount: number;
  unreadNotificationCount: number;
  broker: {
    isOnline: boolean;
    connectedDeviceCount: number;
  };
};
