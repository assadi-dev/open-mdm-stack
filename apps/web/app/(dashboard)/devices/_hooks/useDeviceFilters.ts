import { useMemo, useState } from "react";
import type { Device, DeviceTab } from "../_types/device.types";
import {
  ALL_FILTER,
  filterDevices,
  toAndroidOptions,
  toGroupOptions,
  toTabCounts,
} from "../_services/devices.utils";

export const useDeviceFilters = (devices: Device[]) => {
  const [tab, setTab] = useState<DeviceTab>("all");
  const [group, setGroup] = useState(ALL_FILTER);
  const [androidVersion, setAndroidVersion] = useState(ALL_FILTER);

  // Les compteurs des onglets et les options des listes décrivent tout le parc, pas la sélection en cours.
  const counts = useMemo(() => toTabCounts(devices), [devices]);
  const groupOptions = useMemo(() => toGroupOptions(devices), [devices]);
  const androidOptions = useMemo(() => toAndroidOptions(devices), [devices]);
  const filteredDevices = useMemo(
    () => filterDevices(devices, { tab, group, androidVersion }),
    [devices, tab, group, androidVersion],
  );

  return {
    tab,
    setTab,
    group,
    setGroup,
    androidVersion,
    setAndroidVersion,
    counts,
    groupOptions,
    androidOptions,
    filteredDevices,
  };
};
