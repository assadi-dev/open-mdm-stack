import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";



type DashboardLayoutProps = {
    children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect("/login")
    }

    return (
        <>
            {children}
        </>
    )
}


export default DashboardLayout;