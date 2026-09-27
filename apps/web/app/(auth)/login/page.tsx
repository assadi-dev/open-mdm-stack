import { generateTitleMetadata, PageProps } from "@/lib/page-metadata"
import { ResolvingMetadata } from "next"

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: "Login" })
    return {
        ...prevMetadata,
        ...metadata
    }
}

const LoginPage = async (props: PageProps) => {
    return (
        <>
            <h1>Welcome to MDM</h1>
            <p>login to access</p>

        </>
    )
}

export default LoginPage