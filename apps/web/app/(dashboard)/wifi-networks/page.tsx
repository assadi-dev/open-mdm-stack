import type { ResolvingMetadata } from "next";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata";
import { WifiNetworksPageClient } from "./_components/WifiNetworksPageClient";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
  const prevMetadata = await parent;
  const metadata = generateTitleMetadata({ title: WIFI_NETWORK.page.title });

  return {
    ...prevMetadata,
    ...metadata,
  };
};

const WifiNetworksPage = async () => {
  return <WifiNetworksPageClient />;
};

export default WifiNetworksPage;
