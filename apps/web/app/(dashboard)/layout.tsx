import { isUserAuthticated } from "@/lib/auth/session-server";


type DashboardLayoutProps = {
    children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
    await isUserAuthticated()
    return (
        <>
            {children}
        </>
    )
}


export default DashboardLayout;