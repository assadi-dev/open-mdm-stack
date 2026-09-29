import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata"
import { ResolvingMetadata } from "next"
import { AuthBrand } from "./_components/AuthBrand"
import { AuthCard } from "./_components/AuthCard"
import { AuthFooter } from "./_components/AuthFooter"
import { getSessionServer } from "@/lib/auth/session-server"
import { redirect } from "next/navigation"

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: "Connexion" })
    return {
        ...prevMetadata,
        ...metadata
    }
}

const LoginPage = async () => {
    const session = await getSessionServer()
    console.log(process.env.NEXT_PUBLIC_HOME_URL);

    /*if (session) {
        redirect(process.env.NEXT_PUBLIC_HOME_URL!)
    }*/

    return (
        <div className="flex min-h-screen flex-col items-center gap-6 p-8">
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <AuthBrand />
                <AuthCard />
            </div>
            <AuthFooter />
        </div>
    )
}

export default LoginPage