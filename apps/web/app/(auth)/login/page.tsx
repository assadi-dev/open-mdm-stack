import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata"
import { ResolvingMetadata } from "next"
import { AuthBrand } from "./_components/AuthBrand"
import { AuthCard } from "./_components/AuthCard"
import { AuthFooter } from "./_components/AuthFooter"

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: "Connexion" })
    return {
        ...prevMetadata,
        ...metadata
    }
}

const LoginPage = async () => {
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