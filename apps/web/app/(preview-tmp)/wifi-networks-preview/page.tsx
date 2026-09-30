import { SidebarInset, SidebarProvider } from "@/components/sidebar/Sidebar";
import { AppSidebar } from "../../(dashboard)/_components/AppSidebar";
import Navbar from "../../(dashboard)/_components/Navbar";
import { WifiNetworksPageClient } from "../../(dashboard)/wifi-networks/_components/WifiNetworksPageClient";

const WifiNetworksPreviewPage = async () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <Navbar />
      <WifiNetworksPageClient />
    </SidebarInset>
  </SidebarProvider>
);

export default WifiNetworksPreviewPage;
