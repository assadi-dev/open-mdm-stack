import { generateTitleMetadata } from "@/lib/page-metadata"
import { ResolvingMetadata } from "next"




export async function generateMetadata(props: any, parent: ResolvingMetadata) {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: "Login", description: "Login to your account" })
    return {
        ...prevMetadata,
        ...metadata
    }
}

const LoginPage = async (props: any) => {
    return (
        <>
            <h1>Welcome to MDM</h1>
            <p>login to access</p>

        </>
    )
}

export default LoginPage