import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";



type DashboardLayoutProps = {
    children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {

    const { data } = await authClient.getSession({
        fetchOptions: {
            headers: await headers(),
        },
    })

    return (
        <>
            {children}
        </>
    )
}


export default DashboardLayout;