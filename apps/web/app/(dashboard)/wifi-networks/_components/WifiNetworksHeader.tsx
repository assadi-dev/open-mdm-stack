import { WIFI_NETWORK } from "@/constants/wifi-network";
import { PageHeader } from "../../_components/PageHeader";
import { toWifiNetworksSubtitle } from "../_services/wifi-networks.utils";

type WifiNetworksHeaderProps = {
  registeredCount?: number;
};

export const WifiNetworksHeader = ({ registeredCount }: WifiNetworksHeaderProps) => (
  <PageHeader
    title={WIFI_NETWORK.page.title}
    subtitle={registeredCount === undefined ? undefined : toWifiNetworksSubtitle(registeredCount)}
  />
);
