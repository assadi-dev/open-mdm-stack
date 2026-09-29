import { SidebarInset, SidebarProvider } from "@/components/sidebar/Sidebar";
import { isUserAuthticated } from "@/lib/auth/session-server";
import { AppSidebar } from "./_components/AppSidebar";


type DashboardLayoutProps = {
    children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
    await isUserAuthticated()
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    )
}


export default DashboardLayout;