import { WIFI_NETWORK } from "@/constants/wifi-network";
import { PageHeader } from "../../_components/PageHeader";
import { toWifiNetworksSubtitle } from "../_services/wifi-networks.utils";
import type { WifiNetwork } from "../_types/wifi-network.types";

type WifiNetworksHeaderProps = {
  networks?: WifiNetwork[];
};

export const WifiNetworksHeader = ({ networks }: WifiNetworksHeaderProps) => (
  <PageHeader title={WIFI_NETWORK.page.title} subtitle={networks ? toWifiNetworksSubtitle(networks) : undefined} />
);
