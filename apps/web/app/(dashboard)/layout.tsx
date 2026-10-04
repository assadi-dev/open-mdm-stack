import { AdbProvider } from "@/components/providers/AdbProvider";
import { SidebarInset, SidebarProvider } from "@/components/sidebar/Sidebar";
import { isUserAuthticated } from "@/lib/auth/session-server";
import { AppSidebar } from "./_components/AppSidebar";
import Navbar from "./_components/Navbar";


type DashboardLayoutProps = {
    children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
    await isUserAuthticated()
    return (
        <AdbProvider>
            <SidebarProvider>

                <AppSidebar />
                <SidebarInset>
                    <Navbar />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </AdbProvider>
    )
}


export default DashboardLayout;